# MIUI STUDIO 技术聊天站

一个支持**数百人实时聊天**的官方技术聊天站：账号注册登录、@任意人提醒、@三个 AI 机器人自动回复。

## 功能
- 🔐 **账号系统**：注册 / 登录（scrypt 加密密码，token 鉴权），一人一号不乱串
- ⚡ **实时聊天**：WebSocket 广播，单进程轻松扛几百并发连接
- 📣 **@提醒**：消息里 `@用户名` 会自动高亮，被@的人收到专属提醒 + 提示音
- 🤖 **三个机器人**（在聊天里 `@` 谁就谁回）：
  - `@小Q` —— 活泼可爱的官方助手（你的化身）
  - `@蓝色大肥鱼` —— 技术专家，爱给代码
  - `@克劳德` —— Claude 风格，结构化思考
- 📱 移动端优先 UI，霓虹暗色风

## 本地运行
```bash
npm install
node server.js
# 打开 http://localhost:3000
```
数据存在 `data/users.json` 和 `data/messages.json`。

## 让机器人变"真 AI"
默认没配 API key，机器人走**本地智能兜底**（保证现在就能玩）。
配了 key 就走真实大模型：

| 环境变量 | 说明 |
|---|---|
| `Q_BOT_KEY` / `Q_BOT_BASE` / `Q_BOT_MODEL` | 小Q（OpenAI 兼容接口） |
| `FISH_BOT_KEY` / `FISH_BOT_BASE` / `FISH_BOT_MODEL` | 蓝色大肥鱼（OpenAI 兼容） |
| `CLAUDE_BOT_KEY` / `CLAUDE_BOT_MODEL` | 克劳德（Anthropic） |

例：`Q_BOT_KEY=sk-xxx Q_BOT_MODEL=gpt-4o-mini node server.js`

## 一键部署（推荐 Render 免费版）
1. 把整个文件夹推到 GitHub
2. 在 [render.com](https://render.com) 新建 Web Service，连该仓库
3. Build: `npm install`，Start: `npm start`
4. 在 Environment 里按需填上面的 key（不填也能跑兜底模式）
> 也可用项目里的 `render.yaml` / `Dockerfile` 部署到任意 Node 平台（Railway / Fly.io / 自己的 VPS）。

## 文件结构
```
config.js   机器人配置 + API key 注入
db.js       账号 / 消息存储（scrypt 加密）
bots.js     机器人回复（真 API / 本地兜底）
server.js   Express + WebSocket 主服务
public/     前端（登录 + 聊天 + @提醒 + 提示音）
```
