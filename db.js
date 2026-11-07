// 数据存储：用户账号 + 聊天记录（JSON 文件持久化，scrypt 加密密码）
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });
const USERS_FILE = path.join(DATA, 'users.json');
const MSG_FILE = path.join(DATA, 'messages.json');

let users = {};
if (fs.existsSync(USERS_FILE)) {
  try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { users = {}; }
}

let messages = [];
if (fs.existsSync(MSG_FILE)) {
  try { messages = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch (e) { messages = []; }
}

// token -> username
const tokens = {};

function saveUsers() { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 0)); }
function saveMessages() {
  fs.writeFileSync(MSG_FILE, JSON.stringify(messages.slice(-config.maxHistory)));
}

function hash(pw, salt) { return crypto.scryptSync(pw, salt, 32).toString('hex'); }

const NAME_RE = /^[一-龥A-Za-z0-9_]{2,20}$/;

function register(username, password) {
  if (!username || !password) return { error: '用户名和密码必填' };
  if (users[username]) return { error: '用户名已存在' };
  if (config.bots.some(b => b.name === username)) return { error: '该名字是系统机器人，不能注册' };
  if (!NAME_RE.test(username)) return { error: '用户名 2-20 位，仅限中英文/数字/下划线' };
  if (password.length < 6) return { error: '密码至少 6 位' };
  const salt = crypto.randomBytes(8).toString('hex');
  users[username] = { salt, hash: hash(password, salt), createdAt: Date.now(), isBot: false };
  saveUsers();
  return { ok: true };
}

function login(username, password) {
  const u = users[username];
  if (!u || u.isBot) return { error: '账号或密码错误' };
  if (hash(password, u.salt) !== u.hash) return { error: '账号或密码错误' };
  return { ok: true, username };
}

function issueToken(username) {
  const t = crypto.randomBytes(24).toString('hex');
  tokens[t] = username;
  return t;
}

function userByToken(t) { return tokens[t] || null; }

// 机器人账号初始化
function seedBots() {
  let changed = false;
  for (const b of config.bots) {
    if (!users[b.name]) { users[b.name] = { isBot: true, bot: b.id, createdAt: Date.now() }; changed = true; }
  }
  if (changed) saveUsers();
}
seedBots();

function botNames() { return config.bots.map(b => b.name); }
function allNames() { return [...Object.keys(users), ...botNames()]; }
function isBot(name) { return !!(users[name] && users[name].isBot); }

function addMessage(msg) {
  messages.push(msg);
  if (messages.length > config.maxHistory) messages = messages.slice(-config.maxHistory);
  saveMessages();
}
function recent(n) { return messages.slice(-n); }

module.exports = {
  register, login, issueToken, userByToken,
  botNames, allNames, isBot, addMessage, recent, seedBots,
};
