#!/usr/bin/env python3
"""Behavioral evidence in a disposable, network-isolated PostgreSQL 18 cluster.

No host database, credentials, bind mount, or published port is used. Docker is
the only dependency. The container and all data are removed even after failure.
"""
import concurrent.futures
import json
import os
import queue
import subprocess
import threading
import time
import unittest
import uuid

IMAGE = 'postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873'
NAME = 'postgres-story-check-' + uuid.uuid4().hex[:10]
POOL = concurrent.futures.ThreadPoolExecutor(4)


def run(*args, input=None, timeout=30):
    return subprocess.check_output(args, input=input, text=True, stderr=subprocess.STDOUT, timeout=timeout).strip()


def sql(query, database='postgres', port=5432):
    return run('docker', 'exec', '-i', NAME, 'psql', '-XqAt', '-v', 'ON_ERROR_STOP=1', '-h', '/tmp' if port != 5432 else '/var/run/postgresql', '-p', str(port), '-U', 'postgres', '-d', database, input=query)


def until(check, timeout=15):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if check():
            return
        time.sleep(.08)
    raise AssertionError('Expected PostgreSQL state was not reached')


class Session:
    def __init__(self, name):
        self.process = subprocess.Popen(['docker', 'exec', '-i', NAME, 'sh', '-c', 'exec psql -XqAt -U postgres -v VERBOSITY=sqlstate 2>&1'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        self.lines = queue.Queue()
        threading.Thread(target=lambda: [self.lines.put(line.rstrip()) for line in self.process.stdout], daemon=True).start()
        self.query("SET application_name='" + name + "'; SET deadlock_timeout='100ms'; SET statement_timeout='8s';")

    def query(self, query):
        marker = 'done_' + uuid.uuid4().hex
        self.process.stdin.write(query + '\n\\echo ' + marker + '\n')
        self.process.stdin.flush()
        result = []
        while True:
            line = self.lines.get(timeout=12)
            if line == marker:
                return '\n'.join(result)
            if line:
                result.append(line)

    def close(self):
        if self.process.poll() is None:
            try:
                self.query('ROLLBACK;')
                self.process.stdin.write('\\q\n')
                self.process.stdin.flush()
                self.process.wait(timeout=3)
            except Exception:
                self.process.kill()
        self.process.stdin.close()
        self.process.stdout.close()


class Behavior(unittest.TestCase):
    def setUp(self):
        sql('DROP TABLE IF EXISTS accounts CASCADE; CREATE TABLE accounts(id int PRIMARY KEY, balance int) WITH (autovacuum_enabled=false); INSERT INTO accounts VALUES(1,100),(2,100);')
        self.sessions = []

    def tearDown(self):
        for session in self.sessions:
            session.close()

    def session(self, name):
        session = Session(name)
        self.sessions.append(session)
        return session

    def test_01_atomicity_savepoints_and_lazy_xid(self):
        a = self.session('lazy')
        self.assertEqual(a.query('BEGIN; SELECT pg_current_xact_id_if_assigned() IS NULL;'), 't')
        a.query('UPDATE accounts SET balance=90 WHERE id=1; SAVEPOINT part; UPDATE accounts SET balance=0 WHERE id=2; ROLLBACK TO part;')
        self.assertEqual(a.query('SELECT pg_current_xact_id_if_assigned() IS NOT NULL; SELECT sum(balance) FROM accounts;'), 't\n190')
        a.query('ROLLBACK;')
        self.assertEqual(sql('SELECT sum(balance) FROM accounts;'), '200')

    def test_02_read_committed_and_repeatable_read(self):
        a = self.session('reader')
        a.query('BEGIN;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'), '100')
        sql('UPDATE accounts SET balance=110 WHERE id=1;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'), '110')
        a.query('COMMIT; BEGIN ISOLATION LEVEL REPEATABLE READ;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'), '110')
        sql('UPDATE accounts SET balance=120 WHERE id=1;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'), '110')

    def test_03_late_commit_stays_invisible_to_old_snapshot(self):
        a, b = self.session('inserter'), self.session('snapshot')
        a.query('BEGIN; INSERT INTO accounts VALUES(3,30);')
        b.query('BEGIN ISOLATION LEVEL REPEATABLE READ;')
        self.assertEqual(b.query('SELECT count(*) FROM accounts;'), '2')
        a.query('COMMIT;')
        self.assertEqual(b.query('SELECT count(*) FROM accounts;'), '2')
        b.query('COMMIT;')
        self.assertEqual(b.query('SELECT count(*) FROM accounts;'), '3')

    def test_04_waiting_update_rechecks_predicate(self):
        a, b = self.session('first'), self.session('second')
        a.query('BEGIN; UPDATE accounts SET balance=110 WHERE id=1;')
        b.query('BEGIN;')
        pending = POOL.submit(b.query, 'UPDATE accounts SET balance=0 WHERE id=1 AND balance=100 RETURNING id;')
        until(lambda: sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='second' AND wait_event_type='Lock';") == '1')
        a.query('COMMIT;')
        self.assertEqual(pending.result(12), '')
        b.query('COMMIT;')
        self.assertEqual(sql('SELECT balance FROM accounts WHERE id=1;'), '110')

    def test_05_nowait_skip_locked_and_deadlock(self):
        a, b = self.session('lock-a'), self.session('lock-b')
        a.query('BEGIN; SELECT id FROM accounts WHERE id=1 FOR UPDATE;')
        self.assertIn('55P03', b.query('BEGIN; SELECT id FROM accounts WHERE id=1 FOR UPDATE NOWAIT;'))
        b.query('ROLLBACK; BEGIN;')
        self.assertEqual(b.query('SELECT id FROM accounts ORDER BY id FOR UPDATE SKIP LOCKED;'), '2')
        first = POOL.submit(a.query, 'SELECT id FROM accounts WHERE id=2 FOR UPDATE;')
        until(lambda: sql("SELECT count(*) FROM pg_stat_activity WHERE application_name='lock-a' AND wait_event_type='Lock';") == '1')
        second = POOL.submit(b.query, 'SELECT id FROM accounts WHERE id=1 FOR UPDATE;')
        replies = [first.result(12), second.result(12)]
        self.assertTrue(any('40P01' in reply for reply in replies), replies)

    def test_06_serializable_prevents_write_skew(self):
        a, b = self.session('ssi-a'), self.session('ssi-b')
        for session in (a, b):
            session.query('BEGIN ISOLATION LEVEL SERIALIZABLE;')
            self.assertEqual(session.query('SELECT count(*) FROM accounts WHERE balance>0;'), '2')
        a.query('UPDATE accounts SET balance=0 WHERE id=1;')
        update = b.query('UPDATE accounts SET balance=0 WHERE id=2;')
        replies = [update, a.query('COMMIT;'), b.query('COMMIT;')]
        self.assertTrue(any('40001' in reply for reply in replies), replies)
        self.assertGreaterEqual(int(sql('SELECT count(*) FROM accounts WHERE balance>0;')), 1)

    def test_07_join_multiplicity_outer_null_and_exists(self):
        sql('DROP TABLE IF EXISTS jl,jr; CREATE TABLE jl(id int,k int); CREATE TABLE jr(id int,k int); INSERT INTO jl VALUES(1,1),(2,1),(3,2),(4,NULL); INSERT INTO jr VALUES(10,1),(11,1),(12,1),(13,3);')
        values = sql('SELECT count(*) FROM jl JOIN jr USING(k); SELECT count(*) FROM jl LEFT JOIN jr USING(k); SELECT count(*) FROM jl FULL JOIN jr USING(k); SELECT count(*) FROM jl WHERE EXISTS(SELECT FROM jr WHERE jr.k=jl.k); SELECT count(*) FROM jl LEFT JOIN jr ON jl.k=jr.k WHERE jr.id>0; SELECT NULL NOT IN (1,NULL);')
        self.assertEqual(values.splitlines()[:5], ['6','8','9','2','6'])

    def test_08_all_six_index_methods(self):
        sql('DROP TABLE IF EXISTS indexed; CREATE TABLE indexed(id int, tags int[], p point); INSERT INTO indexed SELECT i,ARRAY[i%7,i%11],point(i%100,i/100) FROM generate_series(1,10000)i; CREATE INDEX ix_bt ON indexed USING btree(id); CREATE INDEX ix_hash ON indexed USING hash(id); CREATE INDEX ix_gist ON indexed USING gist(p); CREATE INDEX ix_sp ON indexed USING spgist(p); CREATE INDEX ix_gin ON indexed USING gin(tags); CREATE INDEX ix_brin ON indexed USING brin(id); ANALYZE indexed;')
        self.assertEqual(sql("SELECT string_agg(DISTINCT am.amname,',' ORDER BY am.amname) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_am am ON am.oid=c.relam WHERE i.indrelid='indexed'::regclass;"), 'brin,btree,gin,gist,hash,spgist')
        self.assertEqual(sql('SELECT count(*) FROM indexed WHERE tags @> ARRAY[3];'), '2208')

    def test_09_visibility_map_and_index_only_heap_fetches(self):
        sql('CREATE EXTENSION IF NOT EXISTS pg_visibility; DROP TABLE IF EXISTS covered; CREATE TABLE covered(id int,payload int) WITH(autovacuum_enabled=false); INSERT INTO covered SELECT i,i FROM generate_series(1,100)i; CREATE INDEX covered_idx ON covered(id) INCLUDE(payload);')
        sql('VACUUM (FREEZE,ANALYZE) covered;')
        self.assertEqual(sql("SELECT bool_and(all_visible) FROM pg_visibility_map('covered');"), 't')
        before = json.loads(sql('SET enable_seqscan=off; EXPLAIN (ANALYZE,FORMAT JSON) SELECT id,payload FROM covered WHERE id>0;'))[0]['Plan']
        self.assertEqual(before['Node Type'], 'Index Only Scan')
        self.assertEqual(before['Heap Fetches'], 0)
        sql('UPDATE covered SET payload=999 WHERE id=1;')
        after = json.loads(sql('SET enable_seqscan=off; EXPLAIN (ANALYZE,FORMAT JSON) SELECT id,payload FROM covered WHERE id>0;'))[0]['Plan']
        self.assertGreater(after['Heap Fetches'], 0)

    def test_10_triggers_row_statement_and_transaction_rollback(self):
        sql("DROP TABLE IF EXISTS trigger_events; CREATE TABLE trigger_events(n int GENERATED ALWAYS AS IDENTITY,event text); CREATE OR REPLACE FUNCTION trace_trigger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO trigger_events(event) VALUES(TG_WHEN||' '||TG_LEVEL); RETURN NEW; END $$; CREATE TRIGGER a BEFORE UPDATE ON accounts FOR EACH STATEMENT EXECUTE FUNCTION trace_trigger(); CREATE TRIGGER b BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trace_trigger(); CREATE TRIGGER c AFTER UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION trace_trigger(); CREATE TRIGGER d AFTER UPDATE ON accounts FOR EACH STATEMENT EXECUTE FUNCTION trace_trigger(); UPDATE accounts SET balance=balance+1;")
        self.assertEqual(sql("SELECT string_agg(event,',' ORDER BY n) FROM trigger_events;"), 'BEFORE STATEMENT,BEFORE ROW,BEFORE ROW,AFTER ROW,AFTER ROW,AFTER STATEMENT')
        sql('TRUNCATE trigger_events; UPDATE accounts SET balance=1 WHERE false;')
        self.assertEqual(sql("SELECT string_agg(event,',' ORDER BY n) FROM trigger_events;"), 'BEFORE STATEMENT,AFTER STATEMENT')
        sql('TRUNCATE trigger_events; BEGIN; UPDATE accounts SET balance=0; ROLLBACK;')
        self.assertEqual(sql('SELECT count(*) FROM trigger_events;'), '0')

    def test_11_explain_analyze_executes_and_three_join_algorithms(self):
        sql('EXPLAIN ANALYZE UPDATE accounts SET balance=balance+1;')
        self.assertEqual(sql('SELECT min(balance) FROM accounts;'), '101')
        for algorithm, settings in [('Nested Loop','SET enable_hashjoin=off; SET enable_mergejoin=off;'),('Hash Join','SET enable_nestloop=off; SET enable_mergejoin=off;'),('Merge Join','SET enable_nestloop=off; SET enable_hashjoin=off;')]:
            plan=json.loads(sql(settings+' EXPLAIN (ANALYZE,FORMAT JSON) SELECT a.id,b.id FROM generate_series(1,100)a(id) JOIN generate_series(1,100)b(id) USING(id);'))[0]['Plan']
            self.assertEqual(plan['Node Type'],algorithm)
            self.assertEqual(plan['Actual Rows'],100)

    def test_12_physical_replication_and_read_only_standby(self):
        run('docker','exec','-u','postgres',NAME,'pg_basebackup','-h','/var/run/postgresql','-D','/tmp/story-standby','-R','-X','stream',timeout=45)
        run('docker','exec','-u','postgres',NAME,'pg_ctl','-D','/tmp/story-standby','-o','-p 55433 -k /tmp','-l','/tmp/story-standby.log','start')
        try:
            until(lambda: sql('SELECT pg_is_in_recovery();',port=55433)=='t')
            sql('CREATE TABLE replicated_marker(id int PRIMARY KEY); INSERT INTO replicated_marker VALUES(17);')
            def applied():
                try:
                    return sql('SELECT count(*) FROM replicated_marker;',port=55433)=='1'
                except subprocess.CalledProcessError:
                    return False
            until(applied)
            self.assertEqual(sql('SHOW transaction_read_only;',port=55433),'on')
            sql("ALTER SYSTEM SET synchronous_standby_names='FIRST 1 (*)';")
            sql('SELECT pg_reload_conf();')
            sql("SET synchronous_commit='remote_apply'; INSERT INTO replicated_marker VALUES(18);")
            self.assertEqual(sql('SELECT count(*) FROM replicated_marker;',port=55433),'2')
            self.assertEqual(sql('SELECT bool_and(sent_lsn>=write_lsn AND write_lsn>=flush_lsn AND flush_lsn>=replay_lsn) FROM pg_stat_replication;'),'t')
        finally:
            sql("ALTER SYSTEM RESET synchronous_standby_names;")
            sql('SELECT pg_reload_conf();')
            run('docker','exec','-u','postgres',NAME,'pg_ctl','-D','/tmp/story-standby','stop','-m','fast')

    def test_13_old_snapshot_blocks_visibility_map_until_vacuum(self):
        a = self.session('vacuum-reader')
        a.query('BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT balance FROM accounts WHERE id=1;')
        sql('UPDATE accounts SET balance=110 WHERE id=1;')
        sql('VACUUM accounts;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'),'100')
        self.assertEqual(sql("SELECT bool_and(all_visible) FROM pg_visibility_map('accounts');"),'f')
        a.query('COMMIT;')
        sql('VACUUM (FREEZE) accounts;')
        self.assertEqual(sql("SELECT bool_and(all_visible AND all_frozen) FROM pg_visibility_map('accounts');"),'t')

    def test_14_logical_replication_local_write_and_conflict(self):
        sql('CREATE DATABASE story_subscriber;')
        sql('CREATE TABLE logical_orders(id int PRIMARY KEY,note text); CREATE PUBLICATION story_pub FOR TABLE logical_orders;')
        sql('CREATE TABLE logical_orders(id int PRIMARY KEY,note text);',database='story_subscriber')
        sql("SELECT * FROM pg_create_logical_replication_slot('story_slot','pgoutput');")
        sql("CREATE SUBSCRIPTION story_sub CONNECTION 'host=/var/run/postgresql dbname=postgres user=postgres' PUBLICATION story_pub WITH (create_slot=false,slot_name='story_slot',copy_data=false);",database='story_subscriber')
        try:
            sql("INSERT INTO logical_orders VALUES(17,'publisher');")
            until(lambda: sql('SELECT count(*) FROM logical_orders;',database='story_subscriber')=='1')
            sql("INSERT INTO logical_orders VALUES(18,'local write');",database='story_subscriber')
            self.assertEqual(sql('SELECT count(*) FROM logical_orders;',database='story_subscriber'),'2')
            sql("INSERT INTO logical_orders VALUES(18,'conflicting incoming write');")
            until(lambda: int(sql('SELECT coalesce(sum(apply_error_count),0) FROM pg_stat_subscription_stats;',database='story_subscriber'))>0)
            self.assertEqual(sql('SELECT note FROM logical_orders WHERE id=18;',database='story_subscriber'),'local write')
        finally:
            sql('ALTER SUBSCRIPTION story_sub DISABLE;',database='story_subscriber')
            sql('DROP SUBSCRIPTION story_sub;',database='story_subscriber')

    def test_15_view_and_deferred_constraint_trigger(self):
        sql("CREATE VIEW account_view AS SELECT id,balance FROM accounts; CREATE FUNCTION write_view() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN UPDATE accounts SET balance=NEW.balance WHERE id=OLD.id; RETURN NEW; END $$; CREATE TRIGGER view_write INSTEAD OF UPDATE ON account_view FOR EACH ROW EXECUTE FUNCTION write_view(); UPDATE account_view SET balance=120 WHERE id=1;")
        self.assertEqual(sql('SELECT balance FROM accounts WHERE id=1;'),'120')
        sql("CREATE FUNCTION positive_account() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS(SELECT FROM accounts WHERE balance<0) THEN RAISE EXCEPTION 'negative balance'; END IF; RETURN NULL; END $$; CREATE CONSTRAINT TRIGGER positive_balance AFTER UPDATE ON accounts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION positive_account();")
        a=self.session('deferred')
        a.query('BEGIN; UPDATE accounts SET balance=-1 WHERE id=1;')
        self.assertEqual(a.query('SELECT balance FROM accounts WHERE id=1;'),'-1')
        self.assertIn('P0001',a.query('COMMIT;'))
        self.assertEqual(sql('SELECT balance FROM accounts WHERE id=1;'),'120')


if __name__ == '__main__':
    try:
        run('docker','run','--rm','-d','--name',NAME,'--network','none','--memory','768m','--cpus','2','--tmpfs','/var/lib/postgresql/data:rw','-e','PGDATA=/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE,'postgres','-c','wal_level=logical','-c','max_replication_slots=8','-c','max_wal_senders=8')
        until(lambda: subprocess.run(['docker','exec',NAME,'pg_isready','-U','postgres'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0)
        print('Native baseline:',sql('SELECT version();'),flush=True)
        result = unittest.main(verbosity=2,exit=False).result
    finally:
        subprocess.run(['docker','rm','-f',NAME],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        POOL.shutdown(wait=False,cancel_futures=True)
    raise SystemExit(0 if result.wasSuccessful() else 1)
