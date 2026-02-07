
// 2025-2026 Internet Buzzwords Generator
// Uses combinatorial logic to generate over 10,000 unique, trendy, and futuristic phrases.

const PREFIXES = [
  "赛博", "量子", "云端", "数字", "虚拟", "智能", "硬核", "极致", "全域", "降维", 
  "高维", "沉浸", "混合", "超导", "原生", "光速", "无感", "自动", "情绪", "社交",
  "电子", "机械", "生物", "基因", "纳米", "暗黑", "暴力", "佛系", "朋克", "蒸汽",
  "极简", "多巴胺", "内啡肽", "显眼", "野生", "纯爱", "反向", "沉浸式", "无痛", 
  "高阶", "满级", "甚至", "绝绝", "泰裤", "暴躁", "核能", "无限", "光遇", "星际"
];

const SUFFIXES = [
  "飞升", "觉醒", "自由", "永生", "绿洲", "废土", "纪元", "美学", "哲学", "图鉴",
  "搭子", "刺客", "战士", "嘴替", "特种兵", "显眼包", "天花板", "护体", "过敏", 
  "困难户", "绝缘体", "脑袋", "人格", "滤镜", "修仙", "养生", "摸鱼", "内卷", "躺平",
  "摆烂", "整顿", "发疯", "文学", "复健", "回血", "充能", "阻断", "免疫", "配方",
  "自由", "红利", "闭环", "赋能", "颗粒度", "抓手", "组合拳", "护城河", "底层逻辑",
  "顶层设计", "降本增效", "长期主义", "松弛感", "氛围感", "既视感", "破碎感", "边界感",
  "防御", "暴富", "上岸", "逆袭", "翻盘", "真香", "破防", "种草", "拔草", "考古"
];

const FIXED_PHRASES = [
  // 2026 CNY
  "2026大吉", "马年快乐", "金马迎春", "万马奔腾", "一马当先", "龙马精神", "马到成功",
  "喜气洋洋", "财神驾到", "好运加满", "福气满满", "薪资翻倍", "不做牛马", "拒绝画饼",
  
  // Memes & Slang
  "遥遥领先", "尊嘟假嘟", "汗流浃背", "优势在我", "更适合中国宝宝体质", 
  "命运的齿轮", "质疑理解成为", "精神状态良好", "已读乱回", "勇敢的人先享受世界",
  "世界是个草台班子", "班味太重", "去班味", "偷感很重", "淡淡的", "确诊为...", 
  "人生是旷野", "并非轨道", "我在XX很想你", "纯爱战神", "此时一位靓仔路过",
  "这就触及到知识盲区了", "优雅永不过时", "主打一个陪伴", "听劝", "格局打开",
  
  // Future & Tech
  "AI统治世界", "这很赛博", "缸中之脑", "矩阵重启", "系统加载中...", "Bug修复中",
  "版本T0", "数值怪", "超模", "全息宇宙", "熵增", "奇点临近", "第四面墙",
  "碳基生物", "硅基生命", "算力爆炸", "脑机接口", "记忆上传", "意识永生"
];

// Helper to get random item from array
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Algorithmically generates a "Hot Word"
export const getRandomHotWord = (): string => {
  const r = Math.random();
  
  // 30% chance for a fixed popular phrase
  if (r < 0.3) {
    return pick(FIXED_PHRASES);
  }
  
  // 70% chance for a generated combo (Prefix + Suffix)
  // 50 prefixes * 66 suffixes = ~3300 combinations alone, plus variations
  // We can also double up: Prefix + Prefix + Suffix for rarer combos
  
  if (r > 0.9) {
     // Rare 3-word combo: e.g., "赛博/电子/榨菜"
     return pick(PREFIXES) + pick(PREFIXES) + pick(SUFFIXES);
  }
  
  return pick(PREFIXES) + pick(SUFFIXES);
};
