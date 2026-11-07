// MIUI STUDIO 技术聊天站 —— 主服务（Express + WebSocket 实时聊天）
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const db = require('./db');
const bots = require('./bots');
const config = require('./config');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- REST：注册 / 登录 / 历史 ----------
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  const r = db.register(username, password);
  if (r.error) return res.json({ ok: false, error: r.error });
  const token = db.issueToken(username);
  res.json({ ok: true, token, username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const r = db.login(username, password);
  if (r.error) return res.json({ ok: false, error: r.error });
  const token = db.issueToken(username);
  res.json({ ok: true, token, username });
});

app.get('/api/history', (req, res) => {
  const token = req.query.token;
  if (!db.userByToken(token)) return res.json({ ok: false, error: '未登录' });
  res.json({ ok: true, messages: db.recent(100) });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// username -> Set(ws)
const socketsByUser = new Map();
function addSocket(username, ws) {
  if (!socketsByUser.has(username)) socketsByUser.set(username, new Set());
  socketsByUser.get(username).add(ws);
}
function removeSocket(username, ws) {
  const s = socketsByUser.get(username);
  if (s) { s.delete(ws); if (s.size === 0) socketsByUser.delete(username); }
}
function sendToUser(username, obj) {
  const s = socketsByUser.get(username);
  if (!s) return;
  const d = JSON.stringify(obj);
  for (const ws of s) if (ws.readyState === 1) ws.send(d);
}
function onlineCount() {
  // 去重后的在线用户数
  return socketsByUser.size;
}

function broadcast(obj, exceptWs) {
  const d = JSON.stringify(obj);
  for (const ws of wss.clients) {
    if (ws.readyState === 1 && ws !== exceptWs) ws.send(d);
  }
}

function sysMsg(text) {
  broadcast({ type: 'system', text, ts: Date.now() });
}

// 提取被 @ 的名字（精确匹配已知名字，长名优先）
function extractMentions(text) {
  const names = db.allNames().sort((a, b) => b.length - a.length);
  const found = [];
  for (const n of names) {
    if (text.includes('@' + n)) found.push(n);
  }
  return found;
}

let msgId = Date.now();
function nextId() { return ++msgId; }

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const token = url.searchParams.get('token');
  const username = db.userByToken(token);
  if (!username) { ws.close(4001, 'auth'); return; }

  ws.username = username;
  addSocket(username, ws);

  // 欢迎 + 历史 + 在线人数
  ws.send(JSON.stringify({
    type: 'welcome',
    user: username,
    online: onlineCount(),
    history: db.recent(100),
    bots: config.bots.map(b => ({ name: b.name, color: b.color })),
  }));
  sysMsg(`👋 ${username} 进入了聊天室`);
  broadcast({ type: 'online', online: onlineCount() }, ws);

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === 'chat') {
      let text = (msg.text || '').toString().slice(0, 2000);
      // 去除控制字符
  text = text.replace(/[\u0000-\u001f\u007f]/g, '');
      if (!text.trim()) return;

      const mentions = extractMentions(text);
      const obj = {
        type: 'chat', id: nextId(), user: username, text,
        ts: Date.now(), mentions,
      };
      db.addMessage(obj);
      broadcast(obj);

      // 给被 @ 的真人发送私人的"有人 @ 你"提醒
      for (const m of mentions) {
        if (!db.isBot(m) && m !== username) {
          sendToUser(m, { type: 'mention', from: username, text, ts: Date.now() });
        }
      }

      // 触发被 @ 的机器人回复
      const triggered = config.bots.filter(b => mentions.includes(b.name));
      for (const b of triggered) {
        // 机器人"正在输入"
        broadcast({ type: 'typing', user: b.name, on: true });
        const history = db.recent(20);
        const reply = await bots.getBotReply(b, text, history);
        broadcast({
          type: 'chat', id: nextId(), user: b.name, text: reply,
          ts: Date.now(), mentions: [], bot: true, color: b.color,
        });
        broadcast({ type: 'typing', user: b.name, on: false });
      }
    } else if (msg.type === 'typing') {
      broadcast({ type: 'typing', user: username, on: !!msg.on }, ws);
    }
  });

  ws.on('close', () => {
    removeSocket(username, ws);
    sysMsg(`🚪 ${username} 离开了聊天室`);
    broadcast({ type: 'online', online: onlineCount() });
  });
});

server.listen(config.port, () => {
  console.log(`✅ ${config.siteName} 已启动: http://localhost:${config.port}`);
  console.log(`   机器人: ${config.bots.map(b => b.name).join(' / ')}`);
});
