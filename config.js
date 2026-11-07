// 聊天站配置：机器人定义 + API 接入
// 有 key 走真实大模型，没 key 走本地智能兜底（保证现在就能演示）
module.exports = {
  port: process.env.PORT || 3000,
  siteName: 'MIUI STUDIO 技术聊天站',
  // 注册/历史保留
  maxHistory: 500,
  // 三个机器人。api.key 留空则使用本地兜底回复
  bots: [
    {
      id: 'q',
      name: '小Q',
      color: '#5ef0ff',
      persona: '你是小Q，腾讯QQ团队创建的QQ官方AI助手。语气活泼、可爱、直接，像朋友聊天；不用"您"，用"你"；适当用emoji。你很懂技术但回答要接地气。',
      api: {
        type: 'openai',
        key: process.env.Q_BOT_KEY || '',
        base: process.env.Q_BOT_BASE || 'https://api.openai.com/v1',
        model: process.env.Q_BOT_MODEL || 'gpt-4o-mini',
      },
    },
    {
      id: 'fish',
      name: '蓝色大肥鱼',
      color: '#7b5cff',
      persona: '你是一个资深技术专家，代号"蓝色大肥鱼"。回答技术问题时专业、深入、尽量给代码示例，但语气轻松不端着。擅长前端、游戏引擎、后端架构。',
      api: {
        type: 'openai',
        key: process.env.FISH_BOT_KEY || '',
        base: process.env.FISH_BOT_BASE || 'https://api.openai.com/v1',
        model: process.env.FISH_BOT_MODEL || 'gpt-4o-mini',
      },
    },
    {
      id: 'claude',
      name: '克劳德',
      color: '#ff8c42',
      persona: '你是Claude，由Anthropic开发的AI助手。回答 thoughtful、准确、有结构、有礼貌。善于推理和长文写作。',
      api: {
        type: 'anthropic',
        key: process.env.CLAUDE_BOT_KEY || '',
        model: process.env.CLAUDE_BOT_MODEL || 'claude-3-5-sonnet-latest',
      },
    },
  ],
};
