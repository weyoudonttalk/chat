// 端到端测试：注册两个真人 + 互相@ + @机器人
const http = require('http');
const WebSocket = require('ws');

function req(path, body) {
  return new Promise((res) => {
    const r = http.request({ host: 'localhost', port: 3100, path, method: 'POST', headers: { 'Content-Type': 'application/json' } }, (x) => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d)));
    });
    r.write(JSON.stringify(body)); r.end();
  });
}

function wsConnect(token) {
  return new Promise((res) => {
    const ws = new WebSocket('ws://localhost:3100/ws?token=' + token);
    ws.events = [];
    ws.on('message', m => { ws.events.push(JSON.parse(m.toString())); });
    ws.on('open', () => res(ws));
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 注册 李四
  await req('/api/register', { username: '李四', password: '123456' });
  const A = await req('/api/login', { username: '张三', password: '123456' });
  const B = await req('/api/login', { username: '李四', password: '123456' });
  const a = await wsConnect(A.token);
  const b = await wsConnect(B.token);
  await wait(300);

  // 张三 @李四
  a.send(JSON.stringify({ type: 'chat', text: '李四 你在吗 @李四' }));
  await wait(400);
  const mentionToB = b.events.find(e => e.type === 'mention' && e.from === '张三');
  console.log('李四收到 @提醒:', mentionToB ? '✅ ' + mentionToB.from : '❌ 没收到');

  // 张三 @小Q（机器人）
  a.send(JSON.stringify({ type: 'chat', text: '小Q 帮我看下这个bug @小Q' }));
  // 等待机器人回复（兜底~1s）
  let got = null;
  for (let i = 0; i < 25; i++) {
    got = a.events.find(e => e.type === 'chat' && e.bot && e.user === '小Q');
    if (got) break; await wait(200);
  }
  console.log('小Q回复:', got ? '✅ ' + got.text.slice(0, 30) + '…' : '❌ 没回复');

  // 张三 @克劳德
  a.send(JSON.stringify({ type: 'chat', text: '@克劳德 怎么学前端' }));
  let got2 = null;
  for (let i = 0; i < 25; i++) {
    got2 = a.events.find(e => e.type === 'chat' && e.bot && e.user === '克劳德');
    if (got2) break; await wait(200);
  }
  console.log('克劳德回复:', got2 ? '✅ ' + got2.text.slice(0, 30) + '…' : '❌ 没回复');

  // 在线人数检查
  const welcome = a.events.find(e => e.type === 'welcome');
  console.log('欢迎包在线人数:', welcome ? welcome.online : '?', '| 机器人列表:', welcome ? welcome.bots.map(x=>x.name).join('/') : '');

  a.close(); b.close();
  process.exit(0);
})();
