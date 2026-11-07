// 前端：登录 + WebSocket 聊天 + @提醒 + 提示音
const $ = s => document.querySelector(s);
const authEl = $('#auth'), appEl = $('#app');
const msgsEl = $('#msgs'), inputEl = $('#input'), sendBtn = $('#send');
const onlineEl = $('#online'), meEl = $('#me'), typingEl = $('#typing');
let token = '', me = '', ws = null, botsList = [], myName = '';

// ---------- 登录 / 注册 ----------
let mode = 'login';
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  t.classList.add('on'); mode = t.dataset.tab;
  $('#go').textContent = mode === 'login' ? '进入聊天室' : '注册并进入';
  $('#aerr').textContent = '';
});
$('#go').onclick = async () => {
  const username = $('#au').value.trim(), password = $('#ap').value;
  $('#aerr').textContent = '';
  if (!username || !password) { $('#aerr').textContent = '请填写用户名和密码'; return; }
  const r = await fetch('/api/' + (mode === 'login' ? 'login' : 'register'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(x => x.json());
  if (!r.ok) { $('#aerr').textContent = r.error || '失败'; return; }
  token = r.token; me = r.username;
  localStorage.setItem('chat_token', token);
  localStorage.setItem('chat_user', me);
  enter();
};
// 记住登录
if (localStorage.getItem('chat_token')) { token = localStorage.getItem('chat_token'); me = localStorage.getItem('chat_user'); $('#au').value = me; }

function enter() {
  authEl.style.display = 'none'; appEl.style.display = 'flex';
  meEl.textContent = '🙋 ' + me; myName = me;
  connect();
}

$('#logout').onclick = () => {
  if (ws) ws.close(); localStorage.removeItem('chat_token'); localStorage.removeItem('chat_user');
  location.reload();
};

// ---------- WebSocket ----------
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws?token=${token}`);
  ws.onmessage = e => handle(JSON.parse(e.data));
  ws.onclose = () => setTimeout(() => { if (token) connect(); }, 1500); // 断线重连
}

function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function renderText(text, mentions) {
  let html = escapeHtml(text);
  // 高亮 @xxx
  const names = (mentions && mentions.length) ? mentions : dbgNames;
  for (const n of names.sort((a, b) => b.length - a.length)) {
    html = html.split('@' + n).join(`<span class="mention">@${n}</span>`);
  }
  return html;
}
let dbgNames = [];

function handle(m) {
  switch (m.type) {
    case 'welcome':
      myName = m.user; botsList = m.bots || [];
      onlineEl.textContent = '🟢 ' + m.online;
      msgsEl.innerHTML = '';
      (m.history || []).forEach(addMsg);
      break;
    case 'online':
      onlineEl.textContent = '🟢 ' + m.online;
      break;
    case 'chat':
      addMsg(m);
      break;
    case 'system':
      const d = document.createElement('div'); d.className = 'sysmsg'; d.textContent = m.text;
      msgsEl.appendChild(d); scroll();
      break;
    case 'mention':
      if (m.from !== myName) showToast(`💬 ${m.from} 在聊天里 @ 了你`);
      break;
    case 'typing':
      typingEl.innerHTML = m.on ? `<b>${m.user}</b> 正在输入…` : '';
      break;
  }
}

function addMsg(m) {
  dbgNames = Array.from(new Set([...(dbgNames), ...(m.mentions || [])]));
  const el = document.createElement('div');
  el.className = 'msg' + (m.user === myName ? ' mine' : '') + ((m.mentions || []).includes(myName) ? ' mentioned' : '');
  const isBot = m.bot;
  const who = document.createElement('div');
  who.className = 'who' + (isBot ? ' bot' : '');
  who.textContent = m.user;
  if (isBot && m.color) who.style.color = m.color;
  const txt = document.createElement('div');
  txt.className = 'txt';
  txt.innerHTML = renderText(m.text, m.mentions);
  el.appendChild(who); el.appendChild(txt);
  if (m.ts) { const t = document.createElement('div'); t.className = 'me'; t.textContent = new Date(m.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); el.appendChild(t); }
  msgsEl.appendChild(el);
  // 别人 @ 我 -> 提示音 + 滚动到底部时自动滚
  if ((m.mentions || []).includes(myName) && m.user !== myName) beep();
  scroll();
}
function scroll() { msgsEl.scrollTop = msgsEl.scrollHeight; }

// ---------- 发送 ----------
function send() {
  const text = inputEl.value.trim();
  if (!text || !ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify({ type: 'chat', text }));
  inputEl.value = ''; hideSuggest();
}
sendBtn.onclick = send;
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

// 输入 @ 弹出建议
const suggestEl = $('#suggest');
let suggestList = [], suggestIdx = -1;
inputEl.addEventListener('input', () => {
  const v = inputEl.value;
  const at = v.lastIndexOf('@');
  if (at >= 0 && !v.slice(at + 1).includes(' ')) {
    const q = v.slice(at + 1).toLowerCase();
    const all = [...(botsList.map(b => b.name)), ...onlineNamesCache];
    suggestList = all.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
    showSuggest();
  } else hideSuggest();
});
function showSuggest() {
  if (!suggestList.length) { hideSuggest(); return; }
  suggestEl.style.display = 'flex';
  suggestEl.innerHTML = '';
  suggestList.forEach((n, i) => {
    const s = document.createElement('span'); s.textContent = '@' + n; if (i === suggestIdx) s.classList.add('on');
    s.onclick = () => applySuggest(n);
    suggestEl.appendChild(s);
  });
}
function applySuggest(n) {
  const v = inputEl.value; const at = v.lastIndexOf('@');
  inputEl.value = v.slice(0, at) + '@' + n + ' ';
  hideSuggest(); inputEl.focus();
}
function hideSuggest() { suggestEl.style.display = 'none'; suggestIdx = -1; }

// ---------- 在线名单缓存（用于 @ 建议） ----------
let onlineNamesCache = [];
// 简单：从历史/欢迎里收集；这里用 bots + 一个占位，登录后可从消息累积
const _origAdd = addMsg;
addMsg = function (m) { onlineNamesCache.push(m.user); if (onlineNamesCache.length > 50) onlineNamesCache = onlineNamesCache.slice(-50); return _origAdd(m); };

// ---------- toast + 提示音 ----------
let toastTimer = null;
function showToast(text) {
  const t = $('#toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  beep();
}
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.06;
    o.start(); setTimeout(() => o.stop(), 140);
  } catch (e) {}
}

// 自动重连已有登录
if (token && me) enter();
