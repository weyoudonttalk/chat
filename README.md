# MIUI STUDIO 技术聊天站

支持**数百人实时聊天**的官方技术聊天站：账号注册登录、@任意人提醒、**三个 AI 机器人全部在线（由 DeepSeek 驱动）**。

## 机器人（聊天里 @ 谁谁就回）
- `@小Q` —— 活泼可爱的官方助手
- `@蓝色大肥鱼` —— 技术专家，爱甩代码（DeepSeek 驱动）
- `@克劳德` —— Claude 风格结构化思考（DeepSeek 驱动）

> 全部走 **DeepSeek** 真实 API，免费额度充足（新用户到 https://platform.deepseek.com 领）。

## 本地运行
```bash
npm install
DEEPSEEK_KEY=sk-xxxx npm start
# 打开 http://localhost:3000
```
不填 `DEEPSEEK_KEY` 也能跑，但机器人会明确提示"离线"而不是假回复。

## 免费部署（Render，3 分钟）
1. 把本仓库推到你的 GitHub
2. 打开 https://render.com → New Web Service → 连仓库
3. Build: `npm install` / Start: `npm start`
4. 在 Environment 添加 `DEEPSEEK_KEY`（去 platform.deepseek.com 免费领）
5. 等 1 分钟，拿到 `xxx.onrender.com` 公网地址即可几百人访问

也可用仓库里的 `render.yaml` / `Dockerfile` 部署到 Railway / Fly.io / 自己的 VPS。

## 文件
```
config.js   机器人人格 + DeepSeek 配置
db.js       账号（scrypt）/ 消息存储
bots.js     DeepSeek 真实调用
server.js   Express + WebSocket 主服务
public/     前端（登录 + 聊天 + @提醒 + 提示音）
```
