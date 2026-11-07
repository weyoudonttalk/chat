// 机器人回复生成：全部走 DeepSeek 真实 API（OpenAI 兼容接口）
// 没配 DEEPSEEK_KEY 时，明确告知"机器人离线"，不再假回复
const config = require('./config');

// 调用 DeepSeek（OpenAI 兼容）
async function callDeepSeek(persona, prompt, history) {
  const ds = config.deepseek;
  const msgs = [{ role: 'system', content: persona }];
  for (const m of history.slice(-8)) {
    msgs.push({ role: 'user', content: `${m.user}：${m.text}` });
  }
  msgs.push({ role: 'user', content: prompt });

  const r = await fetch(`${ds.base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ds.key}`,
    },
    body: JSON.stringify({
      model: ds.model,
      messages: msgs,
      max_tokens: 700,
      temperature: 0.8,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('deepseek ' + r.status + ' ' + t.slice(0, 200));
  }
  const j = await r.json();
  return (j.choices?.[0]?.message?.content || '').trim() || '(空回复)';
}

async function getBotReply(bot, prompt, history) {
  const key = config.deepseek.key;
  if (!key) {
    return `⚠️ ${bot.name} 当前离线：站长未配置 DeepSeek API Key。请站长到 platform.deepseek.com 领取免费 key 后填入环境变量 DEEPSEEK_KEY。`;
  }
  try {
    return await callDeepSeek(bot.persona, prompt, history);
  } catch (e) {
    console.error('[bot]', bot.name, e.message);
    return `⚠️ ${bot.name} 调用失败：${e.message}（请检查 DEEPSEEK_KEY 是否有效）`;
  }
}

module.exports = { getBotReply };
