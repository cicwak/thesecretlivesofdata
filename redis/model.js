/* Redis 8.0 teaching models. Time and scheduling advance only through actions.
 * These are deliberately small simulations, not a Redis command interpreter. */
const t = (ru, en) => ({ru, en});
const clone = value => JSON.parse(JSON.stringify(value));
const event = (s, ru, en) => { s.events.push(t(ru, en)); s.events = s.events.slice(-8); };
const button = (id, ru, en) => ({id, label:t(ru,en)});
const select = (id, ru, en, values) => ({id, label:t(ru,en), options:values.map(([value,ruLabel,enLabel]) => ({value,label:t(ruLabel,enLabel)}))});
const row = (ru,en,value,status) => ({label:t(ru,en),value:value && typeof value === 'object' && 'ru' in value ? value : String(value),...(status ? {status} : {})});
const panel = (ru,en,rows) => ({title:t(ru,en),rows});
const answer = (s, ru, en, panels, controls) => ({note:t(ru,en),panels,controls:controls.map(control => control.options ? {...control,value:s[control.id]} : control),events:clone(s.events)});
const repr = value => value == null ? '(nil)' : typeof value === 'string' ? value : JSON.stringify(value);
const ids = ['first-key','request','event-loop','dictionary','encodings','atomicity','transactions','scripting','blocking','locks','expiry','memory','latency','rdb','aof','replication','sentinel','cluster','pubsub','streams','specialized'];
export const LAB_IDS = Object.freeze(ids);

// Redis Cluster uses CRC16/XMODEM over UTF-8; only its first {...} pair can supply a nonempty tag.
export function clusterSlot(key) {
  let input = String(key);
  const start = input.indexOf('{');
  const end = start < 0 ? -1 : input.indexOf('}', start + 1);
  if (start >= 0 && end > start + 1) input = input.slice(start + 1, end);
  let crc = 0;
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc % 16384;
}
const wire = '*3\r\n$3\r\nSET\r\n$6\r\nuser:1\r\n$5\r\nAlice\r\n';
const fragments = [wire.slice(0,11), wire.slice(11,27), wire.slice(27)];
const demoHash = key => Array.from(key).reduce((h,ch) => (h + ch.charCodeAt(0)) >>> 0, 0);
const dictionaryKeys = ['cat','act','dog','owl','fox','ant','bee','yak'];
const keyOwner = key => clusterSlot(key) < 8192 ? 'A' : 'B';

export function createLab(id) {
  const initial = {
    'first-key':{data:{},reply:'—',command:'—'},
    request:{fragment:0,input:'',argv:null,validated:false,executed:false,data:{},output:'',reply:'—'},
    'event-loop':{ready:[{client:'A',command:'INCR counter',cost:1},{client:'B',command:'GET counter',cost:1}],busy:null,tick:0,counter:0,done:[],io:0},
    dictionary:{entries:[],capacity:4,old:null,cursor:0,lookup:'—'},
    encodings:{type:'string',count:1,nonInteger:false,grown:false},
    atomicity:{value:10,mode:'unsafe',step:0,reads:{A:null,B:null},increments:0},
    transactions:{data:{balance:10,name:'Alice',bad:'hello'},watched:false,watchDirty:false,inMulti:false,queue:[],result:'—'},
    scripting:{balance:10,runs:0,last:'—',clientWrites:0},
    blocking:{waiting:false,list:[],counter:0,received:[],reply:'—'},
    locks:{now:0,owner:null,deadline:null,reply:'—',externalWrites:0,generation:{A:0,B:0},tokens:{A:null,B:null},firstA:null},
    expiry:{now:0,deadline:5,present:true,value:'Alice',reply:'—'},
    memory:{policy:'allkeys-lru',limit:3,clock:3,sequence:3,items:[{key:'a',last:1,freq:3,freeEffort:128},{key:'b',last:2,freq:1,freeEffort:1},{key:'c',last:3,freq:1,freeEffort:1}],pending:0,reply:'—'},
    latency:{mode:'serial',rtt:8,cost:1,commands:4,total:0,longest:0,last:'—'},
    rdb:{parent:{A:'v1',B:'v1'},child:null,snapshot:null,copied:[],running:false},
    aof:{ram:0,os:[],disk:[],policy:'everysec',writes:0},
    replication:{primary:[],replica:[],backlog:[],connected:true,primaryFsynced:0,replicaFsynced:0,waitResult:'—',sync:'—'},
    sentinel:{primary:10,replica:10,original:10,down:false,votes:0,promoted:false,oldAvailable:true,partitioned:false,client:'P'},
    cluster:{key:'{user1000}.following',owner:'A',client:'B',migrating:false,moved:false,pair:'tagged',reply:'—'},
    pubsub:{subscribed:true,sequence:0,inbox:[],missed:0},
    streams:{now:0,sequence:1,entries:[{id:'1-0',body:'job:1',delivered:false}],pending:{},acked:[],consumer:'A',aOnline:true,reply:'—'},
    specialized:{type:'json',count:0,queried:false}
  };
  if (!ids.includes(id)) throw new RangeError(`Unknown lab: ${id}`);
  return {id,...initial[id],events:[]};
}

export function reduceLab(state, action, value) {
  if (!state || !ids.includes(state.id)) throw new RangeError('Unknown lab state');
  if (action === 'reset') return createLab(state.id);
  const s = clone(state);
  switch (s.id) {
    case 'first-key': {
      if (action === 'set' || action === 'overwrite') {
        const name = action === 'set' ? 'Alice' : 'Bob';
        s.data['user:1'] = name; s.command = `SET user:1 ${name}`; s.reply = 'OK';
        event(s,`Ключ user:1 теперь хранит ${name}.`,`The key user:1 now stores ${name}.`);
      } else if (action === 'get') {
        s.command = 'GET user:1'; s.reply = repr(s.data['user:1']);
        event(s,`GET возвращает ${s.reply}.`,`GET returns ${s.reply}.`);
      } else if (action === 'delete') {
        s.command = 'DEL user:1'; s.reply = String('user:1' in s.data ? 1 : 0); delete s.data['user:1'];
        event(s,'DEL удаляет ссылку на ключ; следующий GET вернёт (nil).','DEL removes the key; the next GET will return (nil).');
      }
      break;
    }
    case 'request': {
      if (action === 'receive') {
        if (s.fragment < fragments.length) {
          s.input += fragments[s.fragment++];
          event(s,`Получен фрагмент ${s.fragment}/3. TCP не хранит границы команд.`,`Received fragment ${s.fragment}/3. TCP does not preserve command boundaries.`);
        }
      } else if (action === 'parse') {
        if (s.argv) event(s,'Команда уже разобрана.','The command has already been parsed.');
        else if (s.input !== wire) event(s,'RESP ещё неполный: исполнитель пока ничего не меняет.','RESP is incomplete: execution cannot change anything yet.');
        else { s.argv = ['SET','user:1','Alice']; s.input = ''; event(s,'Из RESP собран массив аргументов SET, user:1, Alice.','RESP is decoded into the arguments SET, user:1, Alice.'); }
      } else if (action === 'validate') {
        if (!s.argv) event(s,'Сначала соберите и разберите команду.','Receive and parse the command first.');
        else { s.validated = true; event(s,'SET найден; число аргументов, ACL и состояние сервера допускают исполнение.','SET exists; argument count, ACL, and server state allow execution.'); }
      } else if (action === 'execute') {
        if (!s.validated) event(s,'Команда ожидает проверки.','The command needs validation.');
        else if (s.executed) event(s,'Эта команда уже исполнена; осталось отправить ответ.','This command already executed; send its reply next.');
        else { s.executed=true; s.data['user:1'] = 'Alice'; s.output = '+OK\r\n'; event(s,'SET изменил словарь. Ответ +OK находится в выходном буфере.','SET changed the dictionary. The +OK reply is in the output buffer.'); }
      } else if (action === 'flush') {
        if (!s.output) event(s,'Выходной буфер пуст.','The output buffer is empty.');
        else { s.reply = s.output; s.output = ''; event(s,'Сетевой слой отправил ответ клиенту.','The networking layer sent the reply to the client.'); }
      }
      break;
    }
    case 'event-loop': {
      if (action === 'expensive') {
        s.ready.push({client:'C',command:'KEYS *',cost:8});
        event(s,'Клиент C готов выполнить долгую команду: 8 учебных тактов.','Client C is ready to run a long command: 8 simulated ticks.');
      } else if (action === 'enqueue') {
        s.ready.push({client:'D',command:'INCR counter',cost:1});
        event(s,'Ещё один клиент готов. Порядок готовности выбран сценарием, это не гарантия общей FIFO.','Another client is ready. This scenario chooses the readiness order; Redis does not promise a global FIFO.');
      } else if (action === 'io') {
        s.io++; event(s,'I/O подготовил сетевые данные. Изменение ключей по-прежнему ждёт исполнителя.','I/O prepared network data. Key changes still wait for command execution.');
      } else if (action === 'tick') {
        s.tick++;
        if (!s.busy && s.ready.length) { s.busy = s.ready.shift(); s.busy.remaining = s.busy.cost; }
        if (!s.busy) event(s,'Нет готовой работы. Event loop может ожидать события.','No work is ready. The event loop can wait for events.');
        else {
          s.busy.remaining--;
          if (s.busy.remaining === 0) {
            const work = s.busy;
            if (work.command.startsWith('INCR')) s.counter++;
            s.done.push(`${work.client}: ${work.command} → ${work.command.startsWith('INCR') || work.command.startsWith('GET') ? s.counter : '[counter]'}`);
            s.done = s.done.slice(-5); s.busy = null;
            event(s,`Команда клиента ${work.client} завершена.`,`Client ${work.client}'s command completed.`);
          } else event(s,`Клиент ${s.busy.client} занимает исполнителя; остальные ждут.`,`Client ${s.busy.client} occupies command execution; others wait.`);
        }
      }
      break;
    }
    case 'dictionary': {
      if (action === 'insert') {
        const key = dictionaryKeys[s.entries.length];
        if (key) {
          s.entries.push(key);
          event(s,`${key} помещён в корзину ${demoHash(key) % s.capacity}. Коллизия требует сравнения ключей.`,`${key} goes into bucket ${demoHash(key) % s.capacity}. Collisions require comparing keys.`);
        }
      } else if (action === 'grow') {
        if (!s.old) { s.old = s.entries.length ? {capacity:s.capacity,entries:s.entries.slice()} : null; s.capacity *= 2; s.cursor = 0; event(s,'Выделена новая таблица. Старые записи переносятся постепенно.','A new table is allocated. Existing entries move incrementally.'); }
      } else if (action === 'rehash') {
        if (s.old) {
          const moved = s.old.entries.filter(key => demoHash(key) % s.old.capacity === s.cursor);
          s.old.entries = s.old.entries.filter(key => demoHash(key) % s.old.capacity !== s.cursor);
          event(s,`Перенесена корзина ${s.cursor}: ${moved.join(', ') || '∅'}.`,`Moved bucket ${s.cursor}: ${moved.join(', ') || '∅'}.`);
          s.cursor++;
          if (s.old.entries.length === 0) { s.old = null; event(s,'Старая таблица освобождена.','The old table is released.'); }
        }
      } else if (action === 'lookup') {
        const key = s.entries.includes('act') ? 'act' : 'cat';
        const inOld = s.old?.entries.includes(key);
        s.lookup = s.entries.includes(key) ? `${key} → ${inOld ? 'ht[0]' : s.old ? 'ht[1]' : 'ht[0]'}[${demoHash(key) % (inOld ? s.old.capacity : s.capacity)}]` : `${key} → (nil)`;
        event(s,'При rehash поиск может проверить обе таблицы; ключ остаётся доступен.','During rehash, lookup may inspect both tables; the key remains available.');
      }
      break;
    }
    case 'encodings': {
      if (action === 'type' && ['string','hash','list','set','zset'].includes(value)) { s.type = value; s.count = 1; s.nonInteger = false; s.grown = false; }
      if (action === 'text') { s.nonInteger = true; if (s.type === 'string') { s.grown = false; s.count = 5; event(s,'SET demo hello заменил строку коротким текстом; это не APPEND.','SET demo hello replaced the string with short text; this is not APPEND.'); } else event(s,'Выбран короткий текстовый элемент. Упаковка зависит от типа, размера и настроек.','A short text member was selected. Encoding depends on type, size, and configuration.'); }
      if (action === 'grow') {
        s.count = s.type === 'list' ? 6000 : s.type === 'hash' ? 513 : s.type === 'zset' ? 129 : s.type === 'set' ? 513 : 80;
        s.grown = true;
        event(s,'Объект вырос за предел компактного представления при выбранных настройках Redis 8.0.','The object exceeded the compact-encoding threshold with the selected Redis 8.0 settings.');
      }
      break;
    }
    case 'atomicity': {
      if (action === 'unsafe') {
        if (s.mode !== 'unsafe') { Object.assign(s, {value:10,mode:'unsafe',step:0,reads:{A:null,B:null},increments:0}); }
        if (s.step < 4) {
          const who = s.step % 2 === 0 ? 'A' : 'B';
          if (s.step < 2) { s.reads[who] = s.value; event(s,`${who}: GET counter → ${s.value}.`,`${who}: GET counter → ${s.value}.`); }
          else { s.value = s.reads[who] + 1; event(s,`${who}: SET counter ${s.value}. Обновление другого клиента может быть потеряно.`,`${who}: SET counter ${s.value}. Another client's update can be lost.`); }
          s.step++;
        }
      } else if (action === 'incr') {
        if (s.mode !== 'safe') Object.assign(s,{value:10,mode:'safe',step:0,reads:{A:null,B:null},increments:0});
        s.value++; s.increments++;
        event(s,`INCR counter → ${s.value}. Чтение и запись выполнены одной командой.`,`INCR counter → ${s.value}. Read and write happen within one command.`);
      }
      break;
    }
    case 'transactions': {
      if (action === 'watch') {
        if (s.inMulti) { s.result='ERR WATCH inside MULTI is not allowed'; event(s,'WATCH нужно поставить до MULTI.','WATCH must precede MULTI.'); }
        else { if (!s.watched) { s.watched=true; s.watchDirty=false; } event(s,'WATCH balance: клиент добавлен к наблюдателям ключа.','WATCH balance: this client is registered as a watcher.'); }
      }
      else if (action === 'external') { s.data.balance++; if(s.watched)s.watchDirty=true; event(s,'Другой клиент выполнил INCR balance. Если A наблюдает ключ, его попытка помечена изменённой.','Another client ran INCR balance. If A watches the key, its attempt is marked dirty.'); }
      else if (action === 'multi') {
        if(s.inMulti) { s.result='ERR MULTI calls can not be nested'; event(s,'Повторный MULTI не сбрасывает очередь.','A nested MULTI does not reset the queue.'); }
        else { s.inMulti=true; s.queue = ['SET name Bob','INCR balance']; s.result = 'QUEUED, QUEUED'; event(s,'MULTI ставит команды в очередь клиента; ключи ещё не изменились.','MULTI queues this client’s commands; keys have not changed yet.'); }
      }
      else if (action === 'exec') {
        if (!s.inMulti) { s.result = 'ERR EXEC without MULTI'; event(s,'Сначала выполните MULTI и добавьте команды.','Start MULTI and queue commands first.'); }
        else if (s.watchDirty) { s.result = '(nil)'; s.queue = []; s.watched=false; s.watchDirty=false; s.inMulti=false; event(s,'EXEC отменён: наблюдаемый ключ изменился. Ни одна команда очереди не выполнена.','EXEC aborted: the watched key changed. No queued command executed.'); }
        else { s.data.name = 'Bob'; s.data.balance++; s.result = `["OK",${s.data.balance}]`; s.queue = []; s.watched=false; s.watchDirty=false; s.inMulti=false; event(s,'Очередь EXEC выполнена без вмешательства команд других клиентов.','EXEC ran the queued commands without other clients interleaving.'); }
      } else if (action === 'runtime-error') {
        s.data.before = 'saved'; s.data.after = 'saved'; s.queue = []; s.watched=false; s.watchDirty=false; s.inMulti=false;
        s.result = '["OK", "ERR value is not an integer or out of range", "OK"]';
        event(s,'Отдельный пример EXEC: SET before; INCR bad → ошибка; SET after. Успешные записи сохранились.','Separate EXEC example: SET before; INCR bad → error; SET after. Successful writes remain.');
      }
      break;
    }
    case 'scripting': {
      if (action === 'run') { s.balance += 2; s.runs++; s.last = String(s.balance); event(s,'Скрипт выполнил два INCR подряд. Чужие команды между ними не исполнялись.','The script ran two INCR operations. Other clients could not execute between them.'); }
      else if (action === 'fail') { s.balance++; s.runs++; s.last = 'ERR simulated script failure'; event(s,'INCR выполнился, затем скрипт завершился ошибкой. Запись осталась; дальнейший код не выполнялся.','INCR succeeded, then the script failed. The write remains; later code did not execute.'); }
      else if (action === 'client') { s.balance++; s.clientWrites++; s.last = String(s.balance); event(s,'Команда другого клиента исполнилась после завершения скрипта.','Another client’s command ran after the script completed.'); }
      break;
    }
    case 'blocking': {
      if (action === 'block') {
        if (s.waiting) event(s,'Клиент A уже ожидает: по его соединению новая команда не исполняется.','Client A is already waiting; a new command on this connection cannot execute.');
        else if (s.list.length) { const item=s.list.shift(); s.received.push(item); s.reply=`["jobs","${item}"]`; event(s,'Список не пуст: BLPOP вернул элемент сразу.','The list is not empty: BLPOP returned immediately.'); }
        else { s.waiting=true; s.reply='…'; event(s,'Пустой список: A зарегистрирован как ожидающий. Исполнитель свободен.','The list is empty: A is registered as a waiter. Command execution is free.'); }
      } else if (action === 'other') { s.counter++; event(s,`B: INCR counter → ${s.counter}. Ожидание A не мешает B.`,`B: INCR counter → ${s.counter}. A’s wait does not stop B.`); }
      else if (action === 'push') {
        const job = `job:${s.received.length+s.list.length+1}`;
        if (s.waiting) { s.waiting=false; s.received.push(job); s.reply=`["jobs","${job}"]`; event(s,'LPUSH разбудил A и передал ему элемент.','LPUSH woke A and handed it the element.'); }
        else { s.list.unshift(job); event(s,'LPUSH добавил элемент в список.','LPUSH added an element to the list.'); }
      }
      break;
    }
    case 'locks': {
      if (action === 'acquire-a' || action === 'acquire-b') {
        const client = action === 'acquire-a' ? 'A' : 'B';
        if (s.owner && s.now < s.deadline) { s.reply = '(nil)'; event(s,'SET NX не изменил существующий lock.','SET NX did not change the existing lock.'); }
        else { s.generation[client]++; const owner=`${client}:${client.toLowerCase()}${s.generation[client]}`; s.tokens[client]=owner; if(client==='A'&&!s.firstA)s.firstA=owner; s.owner=owner; s.deadline=s.now+5; s.reply='OK'; event(s,`${owner}: SET lock token NX PX 5000 → OK.`,`${owner}: SET lock token NX PX 5000 → OK.`); }
      } else if (action === 'advance') { s.now+=6; event(s,'Прошло 6 секунд. Истёкший lock больше не даёт права владения.','Six seconds passed. An expired lock no longer grants ownership.'); }
      else if (action === 'release-a' || action === 'release-b') {
        const owner = action === 'release-a' ? s.firstA : s.tokens.B;
        if (owner && s.owner === owner && s.now < s.deadline) { s.owner=null; s.deadline=null; s.reply='1'; event(s,'Проверка токена и DEL выполнены одним скриптом. Lock освобождён.','A script checked the token and ran DEL atomically. The lock is released.'); }
        else { s.reply='0'; event(s,'Токен не совпал или TTL истёк. Чужой lock не удалён.','The token differs or the TTL expired. Another owner’s lock was not deleted.'); }
      } else if (action === 'external-a') { s.externalWrites++; event(s,'Старый A записал во внешний ресурс. Без fencing сам ресурс не знает, что срок владения истёк.','Stale A wrote to an external resource. Without fencing, that resource does not know the lease expired.'); }
      break;
    }
    case 'expiry': {
      if (action === 'advance') { s.now+=6; event(s,'Время прошло. Дедлайн истёк, но модель ещё не освобождала запись.','Time advanced. The deadline passed, but the model has not reclaimed the entry yet.'); }
      else if (action === 'get') {
        if (s.present && s.now >= s.deadline) { s.present=false; event(s,'GET обнаружил истечение и удалил ключ лениво.','GET found the key expired and removed it lazily.'); }
        s.reply=s.present?s.value:'(nil)';
      } else if (action === 'sweep') {
        if (s.present && s.now >= s.deadline) { s.present=false; event(s,'Активная очистка выбрала истёкший ключ и удалила его.','Active expiration selected the expired key and removed it.'); }
        else event(s,'Активная очистка не нашла истёкший ключ в этой модели.','Active expiration found no expired key in this model.');
      } else if (action === 'set') { s.present=true; s.deadline=s.now+5; s.reply='OK'; event(s,'SET user:1 Alice PX 5000 назначил новый дедлайн.','SET user:1 Alice PX 5000 assigned a new deadline.'); }
      break;
    }
    case 'memory': {
      if (action === 'policy' && ['allkeys-lru','allkeys-lfu','noeviction'].includes(value)) s.policy=value;
      else if (action === 'touch') { const item=s.items.find(item=>item.key==='a'); if(item){item.last=++s.clock; item.freq++; s.reply='128'; event(s,'LLEN a обновил давность и учебный счётчик частоты.','LLEN a updated recency and the teaching frequency counter.');}else{s.reply='0';} }
      else if (action === 'write') {
        s.sequence++; s.clock++;
        const key=String.fromCharCode(97+s.sequence-1);
        if (s.items.length >= s.limit && s.policy === 'noeviction') {s.reply='OOM command not allowed when used memory > maxmemory'; event(s,'Запись отклонена: noeviction не выбирает жертву.','The write was rejected: noeviction does not choose a victim.');}
        else {
          if (s.items.length>=s.limit) {
            const victims=s.items.slice().sort((a,b)=>s.policy==='allkeys-lru'?a.last-b.last:a.freq-b.freq||a.last-b.last);
            const victim=victims[0]; s.items=s.items.filter(item=>item.key!==victim.key);
            event(s,`${s.policy}: вытеснен ${victim.key}.`,`${s.policy}: evicted ${victim.key}.`);
          }
          s.items.push({key,last:s.clock,freq:1,freeEffort:1}); s.reply='OK';
        }
      } else if (action === 'unlink') {
        if(s.items.length){const item=s.items.shift();s.reply='1';if(item.freeEffort>64){s.pending++;event(s,`UNLINK ${item.key}: большой контейнер удалён из словаря, освобождение поставлено в фон.`,`UNLINK ${item.key}: the large container is unlinked; reclamation is scheduled in the background.`);}else event(s,`UNLINK ${item.key}: маленький объект освобождён синхронно.`,`UNLINK ${item.key}: the small object is reclaimed synchronously.`);}else s.reply='0';
      } else if (action === 'reclaim') { s.pending=0; event(s,'Фоновая работа освободила отложенные значения. RSS может остаться выше из-за аллокатора.','Background work reclaimed deferred values. The allocator can keep RSS higher.'); }
      break;
    }
    case 'latency': {
      if(action==='mode'&&['serial','pipeline'].includes(value))s.mode=value;
      else if(action==='run') {s.total=s.commands*s.cost+(s.mode==='serial'?s.commands:1)*s.rtt;s.longest=s.cost;s.last=s.mode;event(s,`4 команды: ${s.total} мс в модели. Пайплайн сокращает сетевые ожидания, но не стоимость команд.`,`4 commands: ${s.total} ms in this model. Pipelining reduces network waits, not command cost.`);}
      else if(action==='slow') {s.total=20+1;s.longest=20;s.last='KEYS + GET';event(s,'Учебный KEYS занимает 20 мс; GET ждёт его завершения. Реальная стоимость зависит от размера базы.','The teaching KEYS occupies 20 ms; GET waits. Actual cost depends on database size.');}
      else if(action==='scan') {s.total=21;s.longest=3;s.last='SCAN + GET';event(s,'Работа SCAN разбита на небольшие вызовы. GET может пройти между ними; COUNT — подсказка, не строгий лимит.','SCAN work is split across small calls. GET can run between them; COUNT is a hint, not a strict limit.');}
      break;
    }
    case 'rdb': {
      if(action==='fork') {if(s.running)event(s,'Снимок уже выполняется; второй процесс не запущен.','A snapshot is already running; no second child was started.');else{s.child=clone(s.parent);s.running=true;s.copied=[];event(s,'fork: родитель и дочерний процесс сначала разделяют страницы снимка.','fork: parent and child initially share snapshot pages.');}}
      else if(action==='modify') {if(s.running&&!s.copied.includes('A'))s.copied.push('A');s.parent.A=s.parent.A==='v1'?'v2':'v3';event(s,'Родитель изменил страницу A. Дочерний процесс продолжает видеть старую страницу.','The parent changed page A. The child still sees the old page.');}
      else if(action==='finish') {if(s.running){s.snapshot=clone(s.child);s.child=null;s.running=false;event(s,'Дочерний процесс завершил RDB: данные соответствуют моменту fork.','The child completed RDB: its data reflects the fork time.');}else event(s,'Сначала запустите снимок.','Start a snapshot first.');}
      else if(action==='crash') {s.parent=s.snapshot?clone(s.snapshot):{};s.child=null;s.running=false;s.copied=[];event(s,'После перезапуска загружен последний завершённый RDB. Более поздние изменения потеряны.','Restart loaded the last completed RDB. Later changes were lost.');}
      break;
    }
    case 'aof': {
      if(action==='policy'&&['always','everysec','no'].includes(value))s.policy=value;
      else if(action==='write') {s.ram++;s.writes++;s.os.push({kind:'INCR',value:s.ram});if(s.policy==='always')s.disk=clone(s.os);event(s,s.policy==='always'?'INCR записан в журнал и fsync завершён перед ответом.':'INCR выполнен и добавлен в буфер ОС. Ответ не означает завершённый fsync.',s.policy==='always'?'INCR was appended and fsync completed before the reply.':'INCR executed and reached the OS buffer. A reply does not mean fsync completed.');}
      else if(action==='fsync') {s.disk=clone(s.os);event(s,'fsync завершён: журнал модели находится на устойчивом носителе.','fsync completed: the model’s journal is on durable storage.');}
      else if(action==='rewrite') {s.os=[{kind:'BASE',value:s.ram}];s.disk=clone(s.os);event(s,'Упрощённый rewrite завершён с fsync: базовое состояние заменило длинный журнал. Реальный Redis 8 использует multipart AOF и сохраняет хвост записей.','The simplified rewrite completed with fsync: a base state replaced the long journal. Redis 8 uses multipart AOF and preserves concurrent tail writes.');}
      else if(action==='crash') {s.ram=s.disk.length?s.disk[s.disk.length-1].value:0;s.os=clone(s.disk);event(s,'Смоделирована потеря питания: сохранились только данные после завершённого fsync. Это выбранный сценарий сбоя, не прогноз каждого падения процесса.','Simulated power loss retained only data covered by completed fsync. This is one failure scenario, not a prediction of every process crash.');}
      break;
    }
    case 'replication': {
      if(action==='write') {const item=`v${s.primary.length+1}`;s.primary.push(item);s.backlog.push({offset:s.primary.length,item});s.backlog=s.backlog.slice(-3);event(s,`Primary принял ${item}. Учебный прогресс реплики: ${s.replica.length} записей.`,`The primary accepted ${item}. The replica has applied ${s.replica.length} teaching records.`);}
      else if(action==='disconnect') {s.connected=false;event(s,'Связь с репликой прервана. Primary продолжает принимать записи.','The replica link is down. The primary continues accepting writes.');}
      else if(action==='reconnect') {s.connected=true;event(s,'Связь восстановлена. Нажмите синхронизацию, чтобы проверить backlog.','The link is restored. Synchronize to check backlog coverage.');}
      else if(action==='sync') {
        if(!s.connected)event(s,'Передача невозможна: связь прервана.','Transfer is impossible while disconnected.');
        else {
          const offset=s.replica.length;const earliest=s.backlog.length?s.backlog[0].offset:s.primary.length+1;
          s.sync=offset<earliest-1?'FULLRESYNC':'CONTINUE';s.replica=clone(s.primary);
          event(s,s.sync==='FULLRESYNC'?'Backlog уже не покрывает разрыв: нужна полная синхронизация.':'Идентификатор истории совпадает, backlog покрывает разрыв: частичная синхронизация.',s.sync==='FULLRESYNC'?'The backlog no longer covers the gap: a full synchronization is needed.':'The history ID matches and backlog covers the gap: partial synchronization.');
        }
      } else if(action==='wait') {s.waitResult=`WAIT 1 1000 → ${Number(s.connected&&s.replica.length>=s.primary.length)}`;event(s,'WAIT вернул число подтвердивших реплик после ожидания/таймаута. Это подтверждение репликации, не fsync и не гарантия Raft.','WAIT returned the count of acknowledging replicas after waiting/timeout. This acknowledges replication, not fsync or Raft guarantees.');}
      else if(action==='fsync') {s.primaryFsynced=s.primary.length;if(s.connected)s.replicaFsynced=s.replica.length;event(s,'Завершён fsync AOF на доступных узлах (в этой модели AOF включён).','AOF fsync completed on reachable nodes (AOF is enabled in this model).');}
      else if(action==='waitaof') {s.waitResult=`WAITAOF 1 1 1000 → [${Number(s.primaryFsynced>=s.primary.length)},${Number(s.connected&&s.replicaFsynced>=s.primary.length)}]`;event(s,'WAITAOF считает локальное подтверждение fsync и реплики с fsync. При таймауте нужно проверить оба числа.','WAITAOF counts local fsync and replicas that completed fsync. Check both numbers after a timeout.');}
      break;
    }
    case 'sentinel': {
      if(action==='write') {
        if(s.down&&!s.promoted)event(s,'Primary недоступен; клиент должен дождаться нового адреса.','The primary is unavailable; the client must await a new address.');
        else {s.primary++;if(!s.promoted)s.original=s.primary;event(s,`Клиент получил OK; primary = ${s.primary}, реплика = ${s.replica}.`,`The client received OK; primary = ${s.primary}, replica = ${s.replica}.`);}
      } else if(action==='sync') {if(!s.down||(s.promoted&&s.oldAvailable)){s.replica=s.primary;event(s,'Реплика применила текущее значение.','The replica applied the current value.');}else event(s,'Нет доступной реплики для передачи.','No reachable replica can receive the update.');}
      else if(action==='crash') {s.down=true;s.oldAvailable=false;s.votes=0;event(s,'Primary недоступен. Обнаружение отказа требует времени и согласия наблюдателей.','The primary is unreachable. Failure detection takes time and observer agreement.');}
      else if(action==='vote') {s.votes=Math.min(s.partitioned?1:3,s.votes+1);event(s,`Доступных подтверждений: ${s.votes}/3. Для модели нужны quorum 2 и большинство 2.`,`Reachable confirmations: ${s.votes}/3. This model needs quorum 2 and majority 2.`);}
      else if(action==='partition') {s.partitioned=true;s.votes=Math.min(s.votes,1);event(s,'Мы на стороне изолированного Sentinel S1. Он один не может разрешить переключение; два Sentinel на другой стороне могут.','We are observing isolated Sentinel S1. It cannot authorize failover alone; the other two Sentinels can.');}
      else if(action==='rejoin') {s.partitioned=false;s.oldAvailable=true;if(s.promoted){s.replica=s.primary;s.original=s.primary;}event(s,'Связь восстановлена. После переключения старый primary становится репликой новой истории.','Connectivity is restored. After failover, the old primary becomes a replica of the new history.');}
      else if(action==='failover') {
        if(!s.down||s.votes<2||s.partitioned||s.promoted)event(s,'Переключение не выполнено: нужен недоступный primary и разрешение большинства; повторно повышать тот же узел не нужно.','No failover: an unreachable primary and majority authorization are required; an already promoted node needs no second promotion.');
        else {const lost=s.primary-s.replica;s.primary=s.replica;s.promoted=true;s.client='R';event(s,`Реплика повышена. Клиент узнал новый адрес. Потеряно неподтверждённых репликой обновлений: ${lost}.`,`The replica was promoted. The client learned the new address. Updates missing from the replica and lost: ${lost}.`);}
      }
      break;
    }
    case 'cluster': {
      if(action==='key'&&['{user1000}.following','{user1000}.followers','user:1','user:2'].includes(value)) {s.key=value;s.owner=keyOwner(value);s.client=s.owner==='A'?'B':'A';s.migrating=false;s.moved=false;s.reply='—';}
      else if(action==='request') {
        if(s.client!==s.owner)s.reply=`MOVED ${clusterSlot(s.key)} node-${s.owner}:6379`;
        else if(s.migrating&&s.moved)s.reply=`ASK ${clusterSlot(s.key)} node-${s.owner==='A'?'B':'A'}:6379`;
        else s.reply='Alice';
        event(s,`GET ${s.key} → ${s.reply}`,`GET ${s.key} → ${s.reply}`);
      } else if(action==='follow') {s.client=s.owner;event(s,'После MOVED клиент обновил карту слотов.','After MOVED, the client updated its slot map.');}
      else if(action==='migrate') {s.migrating=true;event(s,'Слот помечен MIGRATING на источнике и IMPORTING на цели.','The slot is MIGRATING at the source and IMPORTING at the target.');}
      else if(action==='move') {if(s.migrating){s.moved=true;event(s,'Этот ключ уже перенесён; владелец слота пока прежний.','This key has moved; the slot owner is still unchanged.');}}
      else if(action==='asking') {if(s.migrating&&s.moved){s.reply='ASKING → OK; GET → Alice';event(s,'ASKING разрешил один запрос на импортирующем узле. Карта слотов клиента не меняется.','ASKING allowed one request at the importing node. The client’s slot map does not change.');}else{s.reply=`ASKING → OK; GET → ${s.client===s.owner?'Alice':`MOVED ${clusterSlot(s.key)} node-${s.owner}:6379`}`;event(s,'В Cluster ASKING отвечает OK даже без переноса. Следующий GET всё равно проверяет владельца слота.','In Cluster, ASKING returns OK even without migration. The next GET still checks slot ownership.');}}
      else if(action==='finish') {if(s.migrating&&s.moved){s.owner=s.owner==='A'?'B':'A';s.migrating=false;s.moved=false;event(s,'Перенос завершён: новый владелец опубликован. Старая карта клиента получит MOVED.','Migration finished and the new owner was published. A stale client map will receive MOVED.');}}
      else if(action==='pair'&&['tagged','untagged'].includes(value))s.pair=value;
      else if(action==='multi') {const keys=s.pair==='tagged'?['{user1000}.following','{user1000}.followers']:['user:1','user:2'];s.reply=clusterSlot(keys[0])===clusterSlot(keys[1])?'MGET → [Alice, Bob]':"CROSSSLOT Keys in request don't hash to the same slot";event(s,`MGET: слоты ${keys.map(clusterSlot).join(', ')}.`,`MGET: slots ${keys.map(clusterSlot).join(', ')}.`);}
      break;
    }
    case 'pubsub': {
      if(action==='disconnect'){s.subscribed=false;event(s,'Подписчик отключился. Redis не хранит для него историю Pub/Sub.','The subscriber disconnected. Redis keeps no Pub/Sub history for it.');}
      else if(action==='reconnect'){s.subscribed=true;event(s,'Подписка восстановлена; пропущенные сообщения не воспроизводятся.','The subscription is restored; missed messages are not replayed.');}
      else if(action==='publish'){s.sequence++;if(s.subscribed)s.inbox.push(`message:${s.sequence}`);else s.missed++;event(s,`PUBLISH news message:${s.sequence} → ${Number(s.subscribed)}`,`PUBLISH news message:${s.sequence} → ${Number(s.subscribed)}`);}
      break;
    }
    case 'streams': {
      if(action==='consumer'&&['A','B'].includes(value))s.consumer=value;
      else if(action==='add'){s.sequence++;s.entries.push({id:`${s.sequence}-0`,body:`job:${s.sequence}`,delivered:false});event(s,`XADD jobs * body job:${s.sequence} → ${s.sequence}-0 (учебные ID).`,`XADD jobs * body job:${s.sequence} → ${s.sequence}-0 (teaching IDs).`);}
      else if(action==='read') {
        if(s.consumer==='A'&&!s.aOnline){s.reply='—';event(s,'Обработчик A остановлен. Выберите B.','Worker A is stopped. Choose B.');}
        else {const entry=s.entries.find(entry=>!entry.delivered);if(entry){entry.delivered=true;s.pending[entry.id]={consumer:s.consumer,since:s.now,attempts:1};s.reply=entry.id;event(s,`${s.consumer}: XREADGROUP ... > → ${entry.id}. Запись добавлена в PEL.`,`${s.consumer}: XREADGROUP ... > → ${entry.id}. The entry is now in the PEL.`);}else{s.reply='(nil)';event(s,'Новых записей нет. Ожидающая ACK запись не считается новой.','There are no new entries. A pending entry is not a new entry.');}}
      } else if(action==='crash') {s.aOnline=false;s.consumer='B';event(s,'A остановился до ACK. Запись остаётся в pending; B может забрать её после проверки idle.','A stopped before ACK. The entry remains pending; B can claim it after checking idle time.');}
      else if(action==='advance'){s.now+=6;event(s,'Прошло 6 учебных секунд; минимальный idle для reclaim — 5.','Six teaching seconds passed; reclaim requires at least 5 seconds idle.');}
      else if(action==='claim'){const pending=Object.entries(s.pending).find(([,p])=>s.now-p.since>=5);if(pending){const [id,p]=pending;p.consumer=s.consumer;p.since=s.now;p.attempts++;s.reply=id;event(s,`XAUTOCLAIM: ${id} теперь принадлежит ${s.consumer}. Повторная обработка требует идемпотентности.`,`XAUTOCLAIM: ${id} now belongs to ${s.consumer}. Reprocessing requires idempotency.`);}else{s.reply='[]';event(s,'Нет pending-записей с достаточным idle.','No pending entry has enough idle time.');}}
      else if(action==='ack'){const id=Object.keys(s.pending)[0];if(id){delete s.pending[id];s.acked.push(id);s.reply='1';event(s,`XACK jobs group ${id} → 1. Удалено из PEL, но не из Stream.`,`XACK jobs group ${id} → 1. Removed from the PEL, but not from the stream.`);}else s.reply='0';}
      break;
    }
    case 'specialized': {
      if(action==='type'&&['json','search','vector','timeseries','bitmap','geo','probabilistic'].includes(value)){s.type=value;s.count=0;s.queried=false;}
      else if(action==='insert'){s.count=Math.min(4,s.count+1);s.queried=false;event(s,`Добавлена запись ${s.count}. Посмотрите, как изменилось внутреннее представление.`,`Added record ${s.count}. Inspect how the internal representation changed.`);}
      else if(action==='query'){s.queried=true;event(s,'Результат построен из текущих учебных данных; подробности и ограничения указаны рядом.','The result uses the current teaching data; details and limitations appear alongside it.');}
      break;
    }
  }
  return s;
}

const encoding = s => {
  if(s.type==='string') return s.grown?'raw':s.nonInteger?'embstr':'int';
  if(s.type==='hash') return s.grown?'hashtable':'listpack';
  if(s.type==='list') return s.grown?'quicklist':'listpack';
  if(s.type==='set') return s.grown?'hashtable':s.nonInteger?'listpack':'intset';
  return s.grown?'skiplist':'listpack';
};

export function labView(s) {
  switch(s.id) {
    case 'first-key': return answer(s,'Ключ — имя в словаре. SET заменяет значение целиком; GET не меняет его.','A key is a name in a dictionary. SET replaces its value; GET does not change it.',[
      panel('Клиент','Client',[row('Команда','Command',s.command),row('Ответ','Reply',s.reply,'active')]),
      panel('Память Redis','Redis memory',Object.keys(s.data).length?[{label:'user:1',value:s.data['user:1'],status:'good'}]:[row('Словарь','Dictionary','∅','muted')])
    ],[button('set','SET Alice','SET Alice'),button('get','GET','GET'),button('overwrite','SET Bob','SET Bob'),button('delete','DEL','DEL')]);
    case 'request': return answer(s,'Получите все три фрагмента, разберите RESP, проверьте команду, выполните её и отправьте ответ. Буферы и стадии упрощены.','Receive all three fragments, parse RESP, validate, execute, then send the reply. Buffers and stages are simplified.',[
      panel('Сетевой вход','Network input',[row('Фрагменты','Fragments',`${s.fragment}/3`),row('Входной буфер','Input buffer',s.input?s.input.replace(/\r/g,'\\r').replace(/\n/g,'\\n'):'∅','active'),row('Аргументы','Arguments',repr(s.argv))]),
      panel('Исполнение и ответ','Execution and reply',[row('Проверка','Validation',s.validated?t('ACL ✓ / аргументы ✓','ACL ✓ / arity ✓'):'—'),{label:'user:1',value:repr(s.data['user:1'])},row('Выходной буфер','Output buffer',s.output?s.output.replace(/\r/g,'\\r').replace(/\n/g,'\\n'):'∅'),row('Клиент получил','Client received',s.reply.replace(/\r/g,'\\r').replace(/\n/g,'\\n'))])
    ],[button('receive','Получить фрагмент','Receive fragment'),button('parse','Разобрать RESP','Parse RESP'),button('validate','Проверить','Validate'),button('execute','Выполнить SET','Execute SET'),button('flush','Отправить ответ','Send reply')]);
    case 'event-loop': return answer(s,'Обычные команды этого сервера выполняются последовательно. Сетевой I/O и фоновая работа могут выполняться другими потоками; долгая команда всё равно задерживает следующие.','Ordinary commands on this server execute serially. Network I/O and background work may use other threads; a long command still delays subsequent commands.',[
      panel('Исполнитель','Command execution',[row('Такт','Tick',s.tick),row('Сейчас','Running',s.busy?`${s.busy.client}: ${s.busy.command} (${s.busy.remaining})`:'—','active'),{label:'counter',value:String(s.counter)},row('Сетевая работа','Network work',s.io)]),
      panel('Готовые клиенты','Ready clients',s.ready.length?s.ready.map((job,i)=>({label:`${i+1}. ${job.client}`,value:`${job.command} [${job.cost}]`,status:'muted'})):[row('Готовность','Ready','∅')]),
      panel('Завершено','Completed',s.done.length?s.done.map((value,i)=>({label:String(i+1),value})):[row('Ответы','Replies','∅')])
    ],[button('tick','Один такт','One tick'),button('expensive','Долгая команда C','Long command C'),button('enqueue','Добавить клиента D','Add client D'),button('io','Сетевая работа','Network I/O')]);
    case 'dictionary': {
      const oldEntries=s.old?s.old.entries:[];const newEntries=s.entries.filter(key=>!oldEntries.includes(key));
      const buckets=(capacity,keys)=>Array.from({length:capacity},(_,i)=>({label:`[${i}]`,value:keys.filter(key=>demoHash(key)%capacity===i).join(' → ')||'∅',status:keys.filter(key=>demoHash(key)%capacity===i).length>1?'active':'muted'}));
      return answer(s,'Для видимых коллизий здесь учебный хеш «сумма байтов», а не SipHash Redis. Redis переносит словарь постепенно и ищет ключ в обеих таблицах во время rehash.','For visible collisions this uses a teaching byte-sum hash, not Redis SipHash. Redis rehashes incrementally and searches both tables while entries move.',[
        ...(s.old?[panel(`Старая таблица: ${s.old.capacity}`,`Old table: ${s.old.capacity}`,buckets(s.old.capacity,oldEntries))]:[]),
        panel(s.old?'Новая таблица':'Хеш-таблица',s.old?'New table':'Hash table',buckets(s.capacity,newEntries)),panel('Поиск','Lookup',[row('Результат','Result',s.lookup),row('Курсор rehash','Rehash cursor',s.old?s.cursor:'—')])
      ],[button('insert','Добавить ключ','Insert key'),button('grow','Начать увеличение','Start growing'),button('rehash','Перенести корзину','Move one bucket'),button('lookup','Найти ключ','Look up a key')]);
    }
    case 'encodings': return answer(s,'Одинаковые команды скрывают разные структуры. Показаны выбранные операции при настройках Redis 8.0 по умолчанию. String заменяется через SET, Hash без TTL полей. Рост List — один RPUSH с 6000 двухбайтовых элементов aa: их 12 KiB пересекают целевой порог 8 KiB. Число элементов само по себе не задаёт упаковку.','The same commands hide different structures. These are selected operations with Redis 8.0 defaults. Strings are replaced using SET; Hash fields have no TTL. List growth is one RPUSH of 6000 two-byte aa entries: their 12 KiB exceeds the 8 KiB target. Item count alone does not determine encoding.',[
      panel('Логический тип','Logical type',[{label:'TYPE',value:s.type},{label:'OBJECT ENCODING',value:encoding(s),status:'active'},row(s.type==='string'?'Длина / элементы':'Элементы',s.type==='string'?'Length / items':'Items',s.count),row('Числовые элементы','Numeric elements',s.nonInteger?'0':'1')]),
      panel('Представление','Representation',[row('Компактность','Compactness',s.grown?t('обычное представление','general representation'):t('малый объект','small object')),row('Структуры','Structures',s.type==='string'?(s.grown||s.nonInteger?'SDS':'integer'):s.type==='zset'&&s.grown?'skiplist + hashtable':s.type==='list'&&s.grown?t('quicklist → узлы listpack','quicklist → listpack nodes'):encoding(s)),row('Назначение','Purpose',s.type==='zset'?'score → rank + member → score':s.type==='list'?t('начало ⇄ блоки ⇄ конец','head ⇄ blocks ⇄ tail'):s.type==='hash'?t('поле → значение','field → value'):s.type==='set'?t('уникальные элементы','unique members'):t('байты / целое число','bytes / integer'))])
    ],[select('type','Тип','Type',[['string','String','String'],['hash','Hash','Hash'],['list','List','List'],['set','Set','Set'],['zset','Sorted Set','Sorted Set']]),button('text',s.type==='string'?'SET demo hello':'Короткий текст',s.type==='string'?'SET demo hello':'Use short text'),button('grow',s.type==='string'?'SET demo: 80 байтов':'Увеличить объект',s.type==='string'?'SET demo: 80 bytes':'Grow object')]);
    case 'atomicity': return answer(s,'Четыре отдельных GET/SET могут переплестись и дать 11 вместо 12. Два INCR выполняют каждое увеличение целиком. Переключение сценария начинает его с 10.','Four separate GET/SET commands can interleave and produce 11 instead of 12. Two INCR commands each perform a complete increment. Switching scenarios starts from 10.',[
      panel('Общее значение','Shared value',[{label:'counter',value:String(s.value),status:s.mode==='unsafe'&&s.step===4?'bad':'good'},row('Сценарий','Scenario',s.mode==='unsafe'?t('GET → SET','GET → SET'):t('INCR','INCR')),row('Шаги','Steps',s.mode==='unsafe'?`${s.step}/4`:s.increments)]),
      panel('Локальная память клиентов','Client-local memory',Object.entries(s.reads).map(([client,value])=>({label:client,value:value===null?'—':`${value} + 1`})))
    ],[button('unsafe','Следующий GET/SET','Next GET/SET'),button('incr','Выполнить INCR','Execute INCR')]);
    case 'transactions': return answer(s,'Для конфликта: WATCH → MULTI → чужой INCR → EXEC. Отдельный пример ошибки выполнения: SET before; INCR bad; SET after — успешные записи не откатываются. Ошибка очереди до EXEC имеет другие правила.','For a conflict: WATCH → MULTI → another INCR → EXEC. The runtime-error example runs SET before; INCR bad; SET after: successful writes are not rolled back. Queue-time errors follow different rules.',[
      panel('Ключи','Keys',Object.entries(s.data).map(([label,value])=>({label,value:String(value)}))),
      panel('Транзакция клиента A','Client A transaction',[row('WATCH активен','WATCH active',s.watched?'1':'0'),row('Попытка помечена изменённой','Attempt marked dirty',s.watchDirty?'1':'0'),row('Очередь','Queue',s.queue.join(' ; ')||'∅'),row('EXEC ответ','EXEC reply',s.result,'active')])
    ],[button('watch','WATCH balance','WATCH balance'),button('multi','MULTI + 2 команды','MULTI + 2 commands'),button('external','Чужой INCR','Another client: INCR'),button('exec','EXEC','EXEC'),button('runtime-error','Ошибка внутри EXEC','Runtime error in EXEC')]);
    case 'scripting': return answer(s,'Lua и Functions не допускают вмешательства чужих команд во время исполнения. Это не откат: ошибка после записи сохраняет запись. После busy-reply-threshold обычные команды получают BUSY; скрипт не останавливается автоматически.','Lua and Functions prevent other commands from interleaving during execution. They do not provide rollback: a write before an error remains. After busy-reply-threshold, ordinary commands receive BUSY; the script is not stopped automatically.',[
      panel('Память сервера','Server memory',[{label:'balance',value:String(s.balance),status:'good'},row('Вызовы скрипта','Script invocations',s.runs),row('Команды другого клиента','Other client commands',s.clientWrites)]),panel('Ответ','Reply',[row('Результат','Result',s.last,'active')])
    ],[button('run','Скрипт: INCR × 2','Script: INCR × 2'),button('fail','Запись, затем ошибка','Write, then error'),button('client','Команда клиента B','Client B command')]);
    case 'blocking': return answer(s,'BLPOP на пустом списке паркует клиентское соединение, а не исполнитель Redis. Ожидающий запрос обслуживается после завершения добавляющей команды. Здесь бесконечный таймаут 0.','BLPOP on an empty list parks the client connection, not Redis command execution. The waiting request is served after the push command completes. This example uses the infinite timeout 0.',[
      panel('Клиент A','Client A',[{label:'BLPOP jobs 0',value:s.waiting?t('ожидает','waiting'):t('готов','ready'),status:s.waiting?'active':'good'},row('Ответ','Reply',s.reply),row('Получено','Received',s.received.join(', ')||'∅')]),
      panel('Сервер и клиент B','Server and client B',[{label:'jobs',value:s.list.join(', ')||'∅'},{label:'counter',value:String(s.counter)}])
    ],[button('block','A: BLPOP jobs 0','A: BLPOP jobs 0'),button('other','B: INCR counter','B: INCR counter'),button('push','B: LPUSH job','B: LPUSH job')]);
    case 'locks': return answer(s,'Сценарий: A берёт lock → проходит 6 с → B берёт lock → старый A пытается освободить его. Токен защищает чужой lock от удаления. Для внешнего ресурса нужны дополнительные гарантии, например проверяемые им fencing tokens.','Try: A acquires → 6 s pass → B acquires → stale A releases. The owner token protects B’s lock from deletion. External resources need additional guarantees, such as fencing tokens checked by the resource.',[
      panel('Lock в Redis','Lock in Redis',[row('Время','Time',`${s.now}s`),row('Токен владельца','Owner token',s.owner||'∅',s.owner&&s.now<s.deadline?'good':'muted'),row('Дедлайн','Deadline',s.deadline===null?'—':`${s.deadline}s`),row('Оставшийся срок','Time remaining',`${s.owner?Math.max(0,s.deadline-s.now):0}s`),row('Ответ','Reply',s.reply)]),
      panel('Внешняя система','External system',[row('Записи старого A без fencing','Stale A writes without fencing',s.externalWrites,s.externalWrites?'bad':'muted')])
    ],[button('acquire-a','A: взять lock','A: acquire lock'),button('advance','+6 секунд','+6 seconds'),button('acquire-b','B: взять lock','B: acquire lock'),button('release-a','Старый A: токен и DEL','Stale A: token + DEL'),button('release-b','B: проверить токен и DEL','B: compare token + DEL'),button('external-a','Старый A: внешняя запись','Stale A: external write')]);
    case 'expiry': return answer(s,'Дедлайн означает, что клиент больше не может прочитать старое значение. Физическое удаление происходит при обращении или активной очистке. Пауза фоновой очистки здесь намеренно управляется вручную. TTL на панели рассчитан без команды; настоящий TTL тоже проверяет истечение.','The deadline makes the old value unavailable to clients. Physical removal happens on access or through active expiration. Background cleanup is deliberately advanced manually here. The displayed TTL is predicted without a command; a real TTL lookup also checks expiration.',[
      panel('Часы и TTL','Clock and TTL',[row('Время','Time',`${s.now}s`),row('Дедлайн','Deadline',`${s.deadline}s`),{label:t('TTL: ожидаемый ответ','TTL: predicted reply'),value:!s.present||s.now>=s.deadline?'-2':String(s.deadline-s.now)}]),
      panel('Доступность и память','Visibility and memory',[row('Логически доступен','Logically visible',s.present&&s.now<s.deadline?'1':'0',s.present&&s.now<s.deadline?'good':'bad'),row('Запись в памяти','Entry in memory',s.present?'1':'0'),row('GET ответ','GET reply',s.reply)])
    ],[button('advance','+6 секунд','+6 seconds'),button('get','GET user:1','GET user:1'),button('sweep','Активная очистка','Active expiration'),button('set','SET с TTL 5 с','SET with 5 s TTL')]);
    case 'memory': return answer(s,'Условный бюджет — три равных ключа, а не реальные байты maxmemory. Жертва LRU/LFU здесь выбирается точно; настоящий Redis использует приближённую выборку и затухающие LFU-счётчики. a — List из 128 крупных элементов в отдельных узлах quicklist; b и c — маленькие строки: UNLINK освобождает дешёвые объекты сразу. Все объекты имеют единственную ссылку. Реальный maxmemory может временно превышаться.','The budget is three equal-sized keys, not real maxmemory bytes. Victims are selected exactly here; Redis uses approximate sampling and decaying LFU counters. a is a List of 128 large entries in separate quicklist nodes; b and c are small strings: UNLINK reclaims cheap objects immediately. All objects have one reference. Real maxmemory can temporarily be exceeded.',[
      panel('Бюджет','Budget',[{label:'maxmemory-policy',value:s.policy},row('Ключи / лимит','Keys / limit',`${s.items.length}/${s.limit}`),row('Отложенное освобождение','Deferred reclamation',s.pending),row('Ответ','Reply',s.reply,s.reply.startsWith('OOM')?'bad':'active')]),
      panel('Ключи: давность и частота','Keys: recency and frequency',s.items.length?s.items.map(item=>({label:item.key,value:`last=${item.last}, freq=${item.freq}; ${item.freeEffort>64?'container':'string'}`})):[row('Словарь','Dictionary','∅')])
    ],[select('policy','Политика','Policy',[['allkeys-lru','LRU','LRU'],['allkeys-lfu','LFU','LFU'],['noeviction','noeviction','noeviction']]),button('touch','LLEN a','LLEN a'),button('write','Добавить ключ','Add key'),button('unlink','UNLINK первого ключа','UNLINK first key'),button('reclaim','Освободить в фоне','Reclaim in background')]);
    case 'latency': return answer(s,'Все числа учебные. RTT 8 мс, исполнение 1 мс, четыре команды. Пайплайн отправляет команды без ожидания каждого ответа, но не превращает их в транзакцию.','All timings are illustrative: 8 ms RTT, 1 ms execution, four commands. Pipelining sends commands without awaiting each reply; it does not make them a transaction.',[
      panel('Параметры','Parameters',[row('Режим','Mode',s.mode==='serial'?t('по одной','one at a time'):t('пайплайн','pipeline')),{label:'RTT',value:`${s.rtt} ms`},row('Стоимость команды','Command cost',`${s.cost} ms`)]),
      panel('Измерение','Measurement',[row('Сценарий','Scenario',s.last==='serial'?t('по одной','one at a time'):s.last==='pipeline'?t('пайплайн','pipeline'):s.last),row('Полное время','Total time',`${s.total} ms`,'active'),row('Наибольшая непрерывная работа','Longest execution slice',`${s.longest} ms`),row('Инструменты','Tools','INFO · SLOWLOG · LATENCY · MEMORY USAGE')])
    ],[select('mode','Передача','Transport',[['serial','По одной','One at a time'],['pipeline','Пайплайн','Pipeline']]),button('run','Отправить 4 команды','Send 4 commands'),button('slow','KEYS, затем GET','KEYS, then GET'),button('scan','SCAN между GET','SCAN between GETs')]);
    case 'rdb': return answer(s,'Снимок видит страницы на момент fork. Изменение родителя копирует затронутую страницу; повторное изменение той же страницы не создаёт бесконечные копии. Реальные страницы и аллокатор сложнее этой модели.','The snapshot sees pages from fork time. A parent write copies the affected page; another write to that page does not create endless copies. Real pages and allocator behavior are more complex.',[
      panel('Родитель: RAM','Parent: RAM',Object.entries(s.parent).map(([label,value])=>({label:t(`страница ${label}`,`page ${label}`),value,status:s.copied.includes(label)?'active':'good'}))),
      panel('Дочерний процесс','Child process',s.child?Object.entries(s.child).map(([label,value])=>({label:t(`страница ${label}`,`page ${label}`),value})):[row('Состояние','State',s.running?t('работает','running'):t('нет процесса','not running'))]),
      panel('Завершённый RDB','Completed RDB',[row('Данные','Data',repr(s.snapshot)),row('Копии страниц COW','COW page copies',s.copied.length)])
    ],[button('fork','Начать BGSAVE / fork','Start BGSAVE / fork'),button('modify','Изменить страницу A','Change page A'),button('finish','Завершить снимок','Finish snapshot'),button('crash','Сбой и восстановление','Crash and recover')]);
    case 'aof': return answer(s,'Три слоя различаются: значение RAM, журнал в буфере ОС и устойчивый журнал. everysec не означает fsync на каждой записи; кнопка fsync моделирует завершение синхронизации. Rewrite здесь свёрнут в один завершённый шаг.','Distinguish three layers: the RAM value, OS-buffered journal, and durable journal. everysec does not fsync every write; the fsync button models completed synchronization. Rewrite is condensed into one completed step.',[
      panel('Память и политика','Memory and policy',[{label:'counter (RAM)',value:String(s.ram),status:'active'},{label:'appendfsync',value:s.policy}]),
      panel('Буфер ОС','OS buffer',[row('Записи','Entries',s.os.map(entry=>`${entry.kind} → ${entry.value}`).join(' ; ')||'∅')]),
      panel('Диск после fsync','Disk after fsync',[row('Устойчивые записи','Durable entries',s.disk.map(entry=>`${entry.kind} → ${entry.value}`).join(' ; ')||'∅','good'),row('Восстановится counter','Recoverable counter',s.disk.at(-1)?.value??0)])
    ],[select('policy','appendfsync','appendfsync',[['always','always','always'],['everysec','everysec','everysec'],['no','no','no']]),button('write','INCR counter','INCR counter'),button('fsync','Завершить fsync','Complete fsync'),button('rewrite','Завершить rewrite','Complete rewrite'),button('crash','Потерять питание','Lose power')]);
    case 'replication': return answer(s,'Запись на primary и применение на реплике — разные события. Backlog вмещает три учебные записи; настоящие offsets измеряются байтами. Предполагаем совпадающий replication ID. Прогресс ниже считается учебными записями, не байтами. WAIT/WAITAOF здесь показывают результат после ожидания/таймаута.','Primary writes and replica application are separate events. The backlog holds three teaching writes; real offsets count bytes. A matching replication ID is assumed. The progress below counts teaching records, not bytes. WAIT/WAITAOF show the outcome after waiting/timeout.',[
      panel('Primary','Primary',[row('История','History',s.primary.join(', ')||'∅'),row('Применено записей','Records applied',s.primary.length),row('AOF: fsync записей','AOF: records fsynced',s.primaryFsynced)]),
      panel('Реплика','Replica',[row('История','History',s.replica.join(', ')||'∅'),row('Применено записей','Records applied',s.replica.length),row('AOF: fsync записей','AOF: records fsynced',s.replicaFsynced),row('Связь','Link',s.connected?'1':'0',s.connected?'good':'bad')]),
      panel('Передача и подтверждение','Transfer and acknowledgment',[{label:'backlog',value:s.backlog.map(item=>item.offset).join(', ')||'∅'},{label:'PSYNC',value:s.sync},row('Ответ','Reply',s.waitResult,'active')])
    ],[button('write','Записать на primary','Write on primary'),button('disconnect','Разорвать связь','Disconnect'),button('reconnect','Восстановить связь','Reconnect'),button('sync','Синхронизировать','Synchronize'),button('wait','WAIT 1 1000','WAIT 1 1000'),button('fsync','fsync на узлах','fsync on nodes'),button('waitaof','WAITAOF 1 1 1000','WAITAOF 1 1 1000')]);
    case 'sentinel': return answer(s,'Три Sentinel, quorum 2: обнаружение и выборы здесь сведены к подтверждениям. При разделении мы наблюдаем изолированный S1; два других Sentinel могут разрешить переключение на своей стороне. Повышение реплики не возвращает данные, которые она не получила. После переключения клиент узнаёт новый адрес.','Three Sentinels, quorum 2: detection and election are condensed into confirmations. During a partition, we observe isolated S1; the other two can authorize failover on their side. Promotion cannot recover writes the replica never received. Clients discover the new primary address.',[
      panel('Серверы','Servers',[row('Текущий primary','Current primary',`${s.promoted?'R':'P'}: ${s.primary}`,s.down&&!s.promoted?'bad':'good'),row('Реплика','Replica',s.replica),row('Старое значение P','Old P value',s.original),row('Адрес клиента','Client target',s.client)]),
      panel('Наблюдатели','Observers',[row('Подтверждения','Confirmations',`${s.votes}/3`),row('Разделение сети','Network partition',s.partitioned?'1':'0'),row('Повышение выполнено','Promoted',s.promoted?'1':'0')])
    ],[button('write','Записать без ожидания реплики','Write without waiting for replica'),button('sync','Передать на реплику','Replicate'),button('crash','Отключить primary','Disconnect primary'),button('vote','Подтверждение Sentinel','Sentinel confirmation'),button('failover','Попробовать failover','Try failover'),button('partition','Изолировать наблюдателя','Isolate observer'),button('rejoin','Восстановить связь','Restore connectivity')]);
    case 'cluster': return answer(s,'Слот = CRC16/XMODEM(key) mod 16384; непустая первая пара {...} задаёт hash tag. MOVED обновляет карту, ASK перенаправляет только текущую команду с ASKING. Миграция одной записи представляет перенос целого слота. Кнопка MGET сравнивает только слоты и не моделирует временную TRYAGAIN во время переноса.','Slot = CRC16/XMODEM(key) mod 16384; a nonempty first {...} pair supplies the hash tag. MOVED updates the map; ASK redirects just one command with ASKING. Moving one entry represents migrating a whole slot. The MGET button compares slots only and does not model temporary migration TRYAGAIN errors.',[
      panel('Маршрут','Route',[{label:'key',value:s.key},{label:'CRC16 % 16384',value:String(clusterSlot(s.key)),status:'active'},row('Владелец слота','Slot owner',s.owner),row('Карта клиента','Client map',s.client),row('Ключ перенесён','Key moved',s.moved?'1':'0')]),
      panel('Ответ и несколько ключей','Reply and multiple keys',[row('Ответ','Reply',s.reply,'active'),row('Пара ключей','Key pair',s.pair==='tagged'?'{user1000}.following + {user1000}.followers':'user:1 + user:2')])
    ],[select('key','Ключ','Key',[['{user1000}.following','{user1000}.following','{user1000}.following'],['{user1000}.followers','{user1000}.followers','{user1000}.followers'],['user:1','user:1','user:1'],['user:2','user:2','user:2']]),button('request','GET по карте клиента','GET using client map'),button('follow','Обновить карту (MOVED)','Update map (MOVED)'),button('migrate','Начать перенос','Start migration'),button('move','Перенести ключ','Move key'),button('asking','ASKING + GET','ASKING + GET'),button('finish','Завершить перенос','Finish migration'),select('pair','MGET ключи','MGET keys',[['tagged','С общим hash tag','Shared hash tag'],['untagged','Разные слоты','Different slots']]),button('multi','Выполнить MGET','Execute MGET')]);
    case 'pubsub': return answer(s,'Pub/Sub доставляет сообщение текущим подписчикам без истории и повторной выдачи. Счётчик пропущенных сообщений ведёт эта учебная сцена; сервер не хранит его для отключённого подписчика.','Pub/Sub sends messages to current subscribers without history or redelivery. This scene tracks missed messages for teaching; the server does not keep that counter for a disconnected subscriber.',[
      panel('Подписка','Subscription',[row('Подключён','Connected',s.subscribed?'1':'0',s.subscribed?'good':'bad'),row('Опубликовано','Published',s.sequence),row('Пропущено','Missed',s.missed,s.missed?'bad':'muted')]),
      panel('Полученные сообщения','Received messages',s.inbox.length?s.inbox.map((value,i)=>({label:String(i+1),value})):[row('Сообщения','Messages','∅')])
    ],[button('publish','PUBLISH news','PUBLISH news'),button('disconnect','Отключить подписчика','Disconnect subscriber'),button('reconnect','Подписаться снова','Subscribe again')]);
    case 'streams': return answer(s,'Группа уже создана с ID 0. XREADGROUP ... > выдаёт новые записи в PEL; XACK убирает из PEL, сохраняя саму запись. XAUTOCLAIM переносит долго ожидающие записи. ID и idle-время учебные; ответы сокращены до выбранного ID или числа XACK. Обработчик должен выдерживать повторную доставку.','The group is already created at ID 0. XREADGROUP ... > puts new entries in the PEL; XACK removes pending status, keeping the entry itself. XAUTOCLAIM transfers idle pending entries. IDs and idle times are simulated; replies show only a selected ID or XACK count. Handlers must tolerate redelivery.',[
      panel('Stream: radix tree → listpack','Stream: radix tree → listpack',s.entries.map(entry=>({label:entry.id,value:entry.body,status:s.acked.includes(entry.id)?'good':entry.delivered?'active':'muted'}))),
      panel('Pending Entries List','Pending Entries List',Object.keys(s.pending).length?Object.entries(s.pending).map(([id,p])=>({label:id,value:`${p.consumer}; idle=${s.now-p.since}s; deliveries=${p.attempts}`})):[row('Ожидают ACK','Awaiting ACK','∅')]),
      panel('Обработчики','Consumers',[row('Выбран','Selected',s.consumer),row('A работает','A online',s.aOnline?'1':'0'),row('Время','Time',`${s.now}s`),row('Ответ','Reply',s.reply)])
    ],[select('consumer','Обработчик','Consumer',[['A','A','A'],['B','B','B']]),button('add','XADD новую запись','XADD new entry'),button('read','XREADGROUP ... >','XREADGROUP ... >'),button('crash','Остановить A до ACK','Stop A before ACK'),button('advance','+6 секунд idle','+6 seconds idle'),button('claim','XAUTOCLAIM выбранным обработчиком','XAUTOCLAIM as selected consumer'),button('ack','XACK первой pending','XACK first pending')]);
    case 'specialized': return specializedView(s);
    default: throw new RangeError(`Unknown lab: ${s.id}`);
  }
}

function specializedView(s) {
  const docs=[{name:'Alice',text:'redis memory',vector:[1,0],temp:21},{name:'Bob',text:'redis disk',vector:[0,1],temp:22},{name:'Cara',text:'fast memory',vector:[1,1],temp:19},{name:'Dan',text:'disk log',vector:[2,0],temp:23}].slice(0,s.count);
  const configurations={
    json:{ru:'JSON: дерево значений и обновление по пути вместо замены всей строки. JSON сам по себе не создаёт поисковый индекс.',en:'JSON: a value tree and updates by path instead of replacing an entire string. JSON alone does not create a search index.'},
    search:{ru:'Поиск: отдельный инвертированный индекс связывает терм с документами. Индекс ускоряет чтение ценой памяти и работы при записи. Демо сопоставляет слова буквально, без настоящего анализатора и стемминга.',en:'Search: a separate inverted index maps terms to documents. Faster queries cost memory and write-time indexing. This demo matches literal words without a real analyzer or stemming.'},
    vector:{ru:'Векторы: здесь точный FLAT-поиск по евклидовому расстоянию в 2D. HNSW строит граф соседей и приближает поиск, обменивая память и точность на скорость.',en:'Vectors: this is exact FLAT search using 2D Euclidean distance. HNSW builds a neighbor graph for approximate search, trading memory and recall for speed.'},
    timeseries:{ru:'Time series: упорядоченные по времени отсчёты, сжатые блоки и агрегаты. Retention считается от наибольшей временной метки; сжатие и удаление здесь не моделируются побитово.',en:'Time series: time-ordered samples, compressed chunks, and aggregates. Retention uses the highest sample timestamp; compression and deletion are outlined, not simulated bit by bit.'},
    bitmap:{ru:'Bitmap — биты внутри обычной String. Позиция бита представляет пользователя; BITCOUNT считает установленные биты. Слишком большой offset создаёт большой разреженный по смыслу буфер.',en:'A bitmap uses bits inside an ordinary String. A bit position represents a user; BITCOUNT counts set bits. A huge offset allocates a large, logically sparse buffer.'},
    geo:{ru:'Геоиндекс использует Sorted Set и геохеш в score для отбора кандидатов, затем проверяет расстояние. Здесь координаты и отбор показаны схематически, без реализации геохеша.',en:'A geo index uses a Sorted Set with geohash scores to select candidates, then checks distance. This scene sketches coordinates and filtering without implementing geohash.'},
    probabilistic:{ru:'HyperLogLog оценивает число уникальных значений через регистры, не сохраняя сами элементы. Bloom/Cuckoo отвечают о принадлежности с возможными ложными срабатываниями; это другая задача. Здесь регистры — схема, не реализация PFADD.',en:'HyperLogLog estimates cardinality using registers instead of storing members. Bloom/Cuckoo filters test membership with possible false positives: a different problem. These registers are illustrative, not a PFADD implementation.'}
  };
  let rows=[];
  if(s.type==='json')rows=docs.map((doc,i)=>({label:`doc:${i+1}`,value:JSON.stringify({name:doc.name,profile:{active:true}})}));
  if(s.type==='search') {const terms=[...new Set(docs.flatMap(doc=>doc.text.split(' ')))];rows=terms.map(term=>({label:term,value:docs.flatMap((doc,i)=>doc.text.split(' ').includes(term)?[`doc:${i+1}`]:[]).join(', ')}));}
  if(s.type==='vector')rows=docs.map((doc,i)=>({label:`doc:${i+1}`,value:`[${doc.vector}] → distance([1,0]) = ${Math.hypot(doc.vector[0]-1,doc.vector[1]).toFixed(2)}`}));
  if(s.type==='timeseries')rows=docs.map((doc,i)=>({label:`12:0${i}`,value:`${doc.temp} °C`}));
  if(s.type==='bitmap')rows=[{label:'bits [0..7]',value:Array.from({length:8},(_,i)=>i<s.count?'1':'0').join(' ')}];
  if(s.type==='geo')rows=docs.map((doc,i)=>({label:doc.name,value:`lon=${(37.60+i*.01).toFixed(2)}, lat=${(55.75+i*.01).toFixed(2)}`}));
  if(s.type==='probabilistic')rows=[row('Регистры (схематично)','Registers (schematic)',[0,0,0,0].map((_,i)=>i<s.count?i%3+1:0).join(' | '))];
  let result='—';
  if(s.queried){
    if(s.type==='json')result=docs[0]?JSON.stringify([docs[0].name]):'(nil)';
    if(s.type==='search')result=docs.flatMap((doc,i)=>doc.text.split(' ').includes('memory')?[`doc:${i+1}`]:[]).join(', ')||'∅';
    if(s.type==='vector'){const sorted=docs.map((doc,i)=>({id:i+1,d:Math.hypot(doc.vector[0]-1,doc.vector[1])})).sort((a,b)=>a.d-b.d||a.id-b.id);result=sorted.length?`doc:${sorted[0].id}`:'∅';}
    if(s.type==='timeseries')result=docs.length?`${(docs.reduce((n,doc)=>n+doc.temp,0)/docs.length).toFixed(2)} °C`:'∅';
    if(s.type==='bitmap')result=String(s.count);
    if(s.type==='geo')result=docs.map(doc=>doc.name).join(', ')||'∅';
    if(s.type==='probabilistic')result=t('оценка cardinality; регистры не хранят элементы','cardinality estimate; registers do not retain members');
  }
  const queries={json:'JSON.GET doc:1 $.name',search:'term: memory',vector:'KNN 1 → [1,0]',timeseries:'AVG (all samples)',bitmap:'BITCOUNT',geo:'GEOSEARCH (schematic)',probabilistic:'PFCOUNT (schematic)'};
  const note=configurations[s.type];
  return answer(s,note.ru,note.en,[panel('Внутреннее представление','Internal representation',rows.length?rows:[row('Записи','Records','∅')]),panel('Запрос','Query',[{label:queries[s.type],value:result,status:'active'},row('Добавлено / максимум','Inserted / maximum',`${s.count}/4`)])],[select('type','Возможность','Capability',[['json','JSON','JSON'],['search','Поиск','Search'],['vector','Векторы','Vectors'],['timeseries','Time series','Time series'],['bitmap','Bitmap','Bitmap'],['geo','Геоиндекс','Geo index'],['probabilistic','Вероятностные структуры','Probabilistic structures']]),button('insert','Добавить запись','Insert record'),button('query','Выполнить запрос','Run query')]);
}
