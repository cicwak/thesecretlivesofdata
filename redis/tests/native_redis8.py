"""Optional behavioral checks against a real Redis 8.0.0; no pip packages.

python3 redis/tests/native_redis8.py --redis-server /path/to/redis-server
Only disposable directories and private Unix sockets are used.
"""
import argparse
import pathlib
import socket
import subprocess
import tempfile
import time
import unittest


class Client:
    def __init__(self, path):
        self.socket = socket.socket(socket.AF_UNIX)
        self.socket.settimeout(3)
        try:
            self.socket.connect(str(path))
        except OSError:
            self.socket.close()
            raise
        self.file = self.socket.makefile("rb")

    def send(self, *args):
        values = [x if isinstance(x, bytes) else str(x).encode() for x in args]
        self.socket.sendall(b"*%d\r\n" % len(values) + b"".join(
            b"$%d\r\n" % len(x) + x + b"\r\n" for x in values))

    def read(self):
        line = self.file.readline()
        if not line:
            raise EOFError("Redis closed the connection")
        kind, value = line[:1], line[1:-2]
        if kind == b"+":
            return value.decode()
        if kind == b"-":
            return {"error": value.decode()}
        if kind == b":":
            return int(value)
        if kind == b"$":
            size = int(value)
            if size < 0:
                return None
            result = self.file.read(size)
            assert self.file.read(2) == b"\r\n"
            return result.decode()
        if kind == b"*":
            return None if int(value) < 0 else [self.read() for _ in range(int(value))]
        raise AssertionError(line)

    def command(self, *args):
        self.send(*args)
        return self.read()

    def close(self):
        self.file.close()
        self.socket.close()


class Redis8(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="r8-audit-", dir="/tmp")
        self.base = pathlib.Path(self.directory.name)
        self.log = (self.base / "server.log").open("ab")
        self.clients = []
        self.start()
        self.a, self.b = self.connect(), self.connect()

    def start(self, *options):
        self.process = subprocess.Popen([
            SERVER, "--port", "0", "--unixsocket", str(self.base / "redis.sock"),
            "--unixsocketperm", "700", "--save", "", "--appendonly", "no",
            "--dir", str(self.base), "--loglevel", "warning", *options,
        ], stdout=self.log, stderr=subprocess.STDOUT)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                self.fail((self.base / "server.log").read_text())
            try:
                probe = Client(self.base / "redis.sock")
                probe.close()
                return
            except (OSError, ConnectionError):
                time.sleep(.01)
        self.fail("Redis did not start")

    def connect(self):
        client = Client(self.base / "redis.sock")
        self.clients.append(client)
        return client

    def stop(self):
        if self.process.poll() is None:
            client = self.connect()
            try:
                client.command("SHUTDOWN", "NOSAVE")
            except EOFError:
                pass
            self.process.wait(timeout=5)
        for client in self.clients:
            client.close()
        self.clients.clear()

    def tearDown(self):
        try:
            self.stop()
        finally:
            if self.process.poll() is None:
                self.process.kill()
                self.process.wait(timeout=5)
            self.log.close()
            self.directory.cleanup()

    def test_incomplete_resp_does_not_execute(self):
        wire = b"*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAli"
        self.a.socket.sendall(wire)
        self.assertIsNone(self.b.command("GET", "user:1"))
        self.a.socket.sendall(b"ce\r\n")
        self.assertEqual(self.a.read(), "OK")
        self.assertEqual(self.b.command("GET", "user:1"), "Alice")

    def test_transaction_runtime_error_does_not_rollback(self):
        self.a.command("MULTI")
        self.a.command("SET", "a", "text")
        self.a.command("INCR", "a")
        self.a.command("SET", "b", "2")
        result = self.a.command("EXEC")
        self.assertEqual(result[0], "OK")
        self.assertIn("not an integer", result[1]["error"])
        self.assertEqual(result[2], "OK")
        self.assertEqual(self.a.command("MGET", "a", "b"), ["text", "2"])

    def test_watch_expiration_aborts_exec(self):
        self.a.command("SET", "watched", "v", "PX", 100)
        self.a.command("WATCH", "watched")
        time.sleep(.15)
        self.a.command("MULTI")
        self.a.command("SET", "result", "written")
        self.assertIsNone(self.a.command("EXEC"))
        self.assertIsNone(self.a.command("GET", "result"))

    def test_script_error_and_script_load_reply(self):
        result = self.a.command("EVAL", "redis.call('SET',KEYS[1],1); error('stop')", 1, "a")
        self.assertIn("stop", result["error"])
        self.assertEqual(self.a.command("GET", "a"), "1")
        digest = self.a.command("SCRIPT", "LOAD", "return 42")
        self.assertRegex(digest, r"^[0-9a-f]{40}$")
        self.assertEqual(self.a.command("EVALSHA", digest, 0), 42)

    def test_blocked_client_does_not_stop_other_clients(self):
        self.a.send("BLPOP", "jobs", 2)
        deadline = time.monotonic() + 1
        while "blocked_clients:1" not in self.b.command("INFO", "clients"):
            self.assertLess(time.monotonic(), deadline)
        self.assertEqual(self.b.command("PING"), "PONG")
        self.b.command("RPUSH", "jobs", "task:1")
        self.assertEqual(self.a.read(), ["jobs", "task:1"])
        self.assertEqual(self.b.command("LLEN", "jobs"), 0)

    def test_expiry_and_set_ttl_rules(self):
        self.a.command("SET", "key", "v", "PX", 10000)
        self.a.command("SET", "key", "next", "KEEPTTL")
        self.assertGreater(self.a.command("PTTL", "key"), 0)
        self.a.command("SET", "key", "last")
        self.assertEqual(self.a.command("PTTL", "key"), -1)
        self.a.command("PEXPIREAT", "key", 1)
        self.assertIsNone(self.a.command("GET", "key"))
        self.assertEqual(self.a.command("PTTL", "key"), -2)

    def test_pubsub_missed_messages_are_not_replayed(self):
        self.assertEqual(self.a.command("SUBSCRIBE", "news"), ["subscribe", "news", 1])
        self.assertEqual(self.b.command("PUBLISH", "news", "hello"), 1)
        self.assertEqual(self.a.read(), ["message", "news", "hello"])
        self.a.command("UNSUBSCRIBE", "news")
        self.assertEqual(self.b.command("PUBLISH", "news", "missed"), 0)
        self.a.command("SUBSCRIBE", "news")
        self.b.command("PUBLISH", "news", "new")
        self.assertEqual(self.a.read(), ["message", "news", "new"])

    def test_pubsub_channel_and_pattern_are_separate_deliveries(self):
        self.a.command("SUBSCRIBE", "news")
        self.a.command("PSUBSCRIBE", "n*")
        self.assertEqual(self.b.command("PUBLISH", "news", "hello"), 2)
        self.assertEqual(self.a.read()[0], "message")
        self.assertEqual(self.a.read()[0], "pmessage")

    def test_stream_ack_claim_and_retention(self):
        self.a.command("XADD", "orders", "1000-0", "order", 42)
        self.a.command("XGROUP", "CREATE", "orders", "workers", 0)
        self.a.command("XREADGROUP", "GROUP", "workers", "A", "STREAMS", "orders", ">")
        claimed = self.b.command("XAUTOCLAIM", "orders", "workers", "B", 0, "0-0", "COUNT", 1)
        self.assertEqual(claimed, ["0-0", [["1000-0", ["order", "42"]]], []])
        self.assertEqual(self.a.command("XPENDING", "orders", "workers")[3], [["B", "1"]])
        self.assertEqual(self.a.command("XACK", "orders", "workers", "1000-0"), 1)
        self.assertEqual(self.a.command("XLEN", "orders"), 1)
        self.assertEqual(self.a.command("XPENDING", "orders", "workers")[0], 0)

    def test_stream_noack_and_trimmed_pending(self):
        self.a.command("XADD", "orders", "1000-0", "order", 42)
        self.a.command("XGROUP", "CREATE", "orders", "workers", 0)
        self.a.command("XREADGROUP", "GROUP", "workers", "A", "NOACK", "STREAMS", "orders", ">")
        self.assertEqual(self.a.command("XPENDING", "orders", "workers")[0], 0)
        self.a.command("XADD", "orders", "1000-1", "order", 43)
        self.a.command("XREADGROUP", "GROUP", "workers", "A", "STREAMS", "orders", ">")
        self.a.command("XTRIM", "orders", "MAXLEN", 0)
        self.assertEqual(self.a.command("XPENDING", "orders", "workers")[0], 1)
        self.assertEqual(self.a.command("XAUTOCLAIM", "orders", "workers", "B", 0, "0-0"), ["0-0", [], ["1000-1"]])

    def test_bitmap_geo_and_hll_reuse_strings_and_zsets(self):
        self.a.command("SETBIT", "flags", 42, 1)
        self.assertEqual(self.a.command("TYPE", "flags"), "string")
        self.assertEqual(self.a.command("BITCOUNT", "flags"), 1)
        self.a.command("GEOADD", "places", 37.6173, 55.7558, "Moscow")
        self.assertEqual(self.a.command("TYPE", "places"), "zset")
        self.assertEqual(self.a.command("GEOSEARCH", "places", "FROMMEMBER", "Moscow", "BYRADIUS", 1, "km"), ["Moscow"])
        self.a.command("PFADD", "visitors", "Alice", "Bob", "Alice")
        self.assertEqual(self.a.command("TYPE", "visitors"), "string")
        self.assertEqual(self.a.command("PFCOUNT", "visitors"), 2)

    def test_rdb_restores_saved_value(self):
        self.a.command("SET", "user:1", "Alice")
        self.assertEqual(self.a.command("SAVE"), "OK")
        self.a.command("SET", "user:1", "Bob")
        self.stop()
        self.start()
        self.a = self.connect()
        self.assertEqual(self.a.command("GET", "user:1"), "Alice")

    def test_wait_inside_multi_does_not_block_and_waitaof_requires_aof(self):
        self.a.command("SET", "a", 1)
        self.a.command("MULTI")
        self.a.command("WAIT", 1, 1500)
        started = time.monotonic()
        self.assertEqual(self.a.command("EXEC"), [0])
        self.assertLess(time.monotonic() - started, 1)
        self.assertIn("appendonly", self.a.command("WAITAOF", 1, 0, 1)["error"])

    def test_unlink_only_defers_expensive_objects(self):
        def freed():
            return int(next(line.split(":", 1)[1] for line in self.b.command("INFO", "memory").splitlines()
                            if line.startswith("lazyfreed_objects:")))
        self.a.command("SET", "small-effort", "x" * 1000000)
        before = freed()
        self.a.command("UNLINK", "small-effort")
        self.assertEqual(freed(), before)
        self.a.command("RPUSH", "large-effort", *(["x" * 9000] * 128))
        self.assertEqual(self.a.command("OBJECT", "ENCODING", "large-effort"), "quicklist")
        self.assertEqual(self.a.command("LLEN", "large-effort"), 128)
        self.a.command("UNLINK", "large-effort")
        deadline = time.monotonic() + 2
        while freed() == before:
            self.assertLess(time.monotonic(), deadline)
            time.sleep(.005)
        self.assertEqual(freed(), before + 1)

    def test_long_script_returns_busy_and_readonly_script_can_be_killed(self):
        self.a.command("CONFIG", "SET", "busy-reply-threshold", 5)
        self.a.send("EVAL", "while true do end", 0)
        try:
            deadline = time.monotonic() + 2
            while True:
                result = self.b.command("PING")
                if isinstance(result, dict) and result["error"].startswith("BUSY"):
                    break
                self.assertLess(time.monotonic(), deadline)
            self.assertEqual(self.b.command("SCRIPT", "KILL"), "OK")
            self.assertIn("killed", self.a.read()["error"].lower())
        finally:
            self.b.command("SCRIPT", "KILL")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--redis-server", required=True)
    args, remaining = parser.parse_known_args()
    SERVER = str(pathlib.Path(args.redis_server).resolve())
    version = subprocess.check_output([SERVER, "--version"], text=True).strip()
    if "v=8.0.0 " not in version:
        parser.error("This audit targets Redis 8.0.0 exactly: " + version)
    print(version, flush=True)
    unittest.main(argv=[__file__, *remaining], verbosity=2)
