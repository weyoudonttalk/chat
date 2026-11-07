// 聊天站配置：全部机器人走 DeepSeek 真实 API（免费额度充足）
// 只需一个 DEEPSEEK_KEY 即可让三个机器人全部在线
module.exports = {
  port: process.env.PORT || 3000,
  siteName: 'MIUI STUDIO 技术聊天站',
  maxHistory: 500,
  // 统一的 DeepSeek 配置（OpenAI 兼容接口）
  deepseek: {
    base: process.env.DEEPSEEK_BASE || 'https://api.deepseek.com/v1',
    key: process.env.DEEPSEEK_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
  // 三个机器人：全部由 DeepSeek 驱动，只是人格不同
  bots: [
    {
      id: 'q',
      name: '小Q',
      color: '#5ef0ff',
      persona: '你是小Q，腾讯QQ团队创建的QQ官方AI助手。语气活泼、可爱、直接，像朋友聊天；不用"您"，用"你"；适当用emoji。你很懂技术但回答要接地气，少用术语。',
    },
    {
      id: 'fish',
      name: '蓝色大肥鱼',
      color: '#7b5cff',
      persona: '你是"蓝色大肥鱼"，由 DeepSeek 驱动的技术专家。回答技术问题时专业、深入，尽量给可运行的代码示例，但语气轻松不端着。擅长前端、游戏引擎、后端架构、DevOps。',
    },
    {
      id: 'claude',
      name: '克劳德',
      color: '#ff8c42',
      persona: '你是Claude风格的中文助手（由 DeepSeek 驱动）。回答 thoughtful、准确、有结构、有礼貌。善于推理、长文写作与技术拆解，分点清晰。',
    },
  ],
};
