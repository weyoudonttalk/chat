// 机器人回复生成：有 API key 走真实大模型，没 key 走本地智能兜底
const config = require('./config');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 本地兜底回复（没配 key 时）：带人格风味 + 回应用户问题
function fallbackReply(bot, prompt, history) {
  const q = (prompt || '').trim();
  // 从最近消息里抓一点上下文
  const lastHuman = [...history].reverse().find(m => !config.bots.some(b => b.name === m.user));
  const ctx = lastHuman ? lastHuman.text : '';
  const short = (q || ctx).slice(0, 40);

  if (bot.id === 'q') {
    const replies = [
      `收到~ 你说的「${short}」我get到了😄 简单说就是：先想清楚要干嘛，再动手，别一上来就猛写。`,
      `嘿，关于「${short}」，我觉得可以这样——拆成小块一步步来，比一次性梭哈稳多了。`,
      `这个问题有意思！「${short}」的话，我建议先查官方文档，很多坑其实文档都写了。`,
      `懂你意思～「${short}」我之前也踩过。记住一句话：能跑起来比完美重要，先出原型再优化。`,
    ];
    return pick(replies);
  }
  if (bot.id === 'fish') {
    const replies = [
      `【技术向】关于「${short}」：核心思路是先确定边界条件，再写最小实现。比如：\n\`\`\`js\nfunction solve(input){ /* TODO: 边界 + 主逻辑 */ return null; }\n\`\`\`\n先把骨架搭起来，细节后面填。`,
      `「${short}」这事儿，我一般分三步：1) 复现问题 2) 定位瓶颈 3) 小步验证。别上来就改全局。`,
      `聊「${short}」：性能问题先看火焰图，别靠猜。架构问题先画边界，再谈技术选型。`,
      `「${short}」——记住，过早优化是万恶之源。先把功能跑通，再谈优雅。`,
    ];
    return pick(replies);
  }
  // claude
  const replies = [
    `关于「${short}」，我的理解是这样的：我们可以把它拆成几个层面来看。首先…其次…最后给出可执行的建议。需要我针对某一点展开吗？`,
    `这是一个很好的问题。「${short}」值得认真分析。我会从原理出发，帮你理清思路，再给实践方案。`,
    `针对「${short}」，我的建议是结构化推进：明确目标 → 评估约束 → 选择路径 → 小步验证。这样风险最低。`,
  ];
  return pick(replies);
}

// 调用真实大模型
async function callOpenAI(api, persona, prompt, history) {
  const msgs = [{ role: 'system', content: persona }];
  for (const m of history.slice(-8)) msgs.push({ role: 'user', content: `${m.user}：${m.text}` });
  msgs.push({ role: 'user', content: prompt });
  const r = await fetch(`${api.base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.key}` },
    body: JSON.stringify({ model: api.model, messages: msgs, max_tokens: 600, temperature: 0.8 }),
  });
  if (!r.ok) throw new Error('openai ' + r.status);
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '(空回复)';
}

async function callAnthropic(api, persona, prompt, history) {
  const msgs = [];
  for (const m of history.slice(-8)) msgs.push({ role: 'user', content: `${m.user}：${m.text}` });
  msgs.push({ role: 'user', content: prompt });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': api.key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: api.model, max_tokens: 600, system: persona, messages: msgs }),
  });
  if (!r.ok) throw new Error('anthropic ' + r.status);
  const j = await r.json();
  return (j.content?.[0]?.text || '(空回复)').trim();
}

async function getBotReply(bot, prompt, history) {
  const api = bot.api || {};
  if (api.key) {
    try {
      if (api.type === 'anthropic') return await callAnthropic(api, bot.persona, prompt, history);
      return await callOpenAI(api, bot.persona, prompt, history);
    } catch (e) {
      // 真实调用失败 -> 兜底，保证不崩
      return fallbackReply(bot, prompt, history) + '\n\n_(AI 接口暂不可用，已切换本地兜底)_';
    }
  }
  // 没配 key：模拟"思考"延迟后返回兜底
  await new Promise(r => setTimeout(r, 500 + Math.random() * 600));
  return fallbackReply(bot, prompt, history);
}

module.exports = { getBotReply, fallbackReply };
