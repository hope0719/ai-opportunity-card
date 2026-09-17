// 本地选品机会卡分析引擎（零依赖，无需任何大模型密钥）
// 与前端 app.js 中的 generateLocalAnalysis 保持同一套规则，
// 供 server.js（API 兜底/免密钥模式）与 analyze.js（命令行）共用。

const PAIN_KEYWORDS = {
  "拉链": { theme: "拉链耐用性", actions: [{ type: "产品", text: "升级 YKK 顺滑拉链，展示 线材防掉测试。" }, { type: "验证", text: "先测 20 个样品，观察拉链投诉是否下降。" }] },
  "zipper": { theme: "Zipper durability", actions: [{ type: "产品", text: "Upgrade to YKK smooth zipper, demo 300-cycle test." }, { type: "验证", text: "Test 20 samples, monitor zipper complaints." }] },
  "容量": { theme: "容量真实度", actions: [{ type: "内容", text: "用实拍装箱图展示真实容量，不用口播数字。" }, { type: "验证", text: "观察退货原因中容量投诉是否下降。" }] },
  "capacity": { theme: "Capacity accuracy", actions: [{ type: "内容", text: "Show real packing photos, no exaggerated numbers." }, { type: "验证", text: "Monitor capacity-related returns." }] },
  "口袋": { theme: "口袋尺寸真实度", actions: [{ type: "产品", text: "加大电源适配器口袋，标注内部可用尺寸。" }, { type: "内容", text: "用真实充电头、平板和线材做装入对比图。" }] },
  "adapter": { theme: "Adapter pocket fit", actions: [{ type: "产品", text: "Resize mesh pockets around common phone and tablet adapters." }, { type: "内容", text: "Show adapter fit with real devices, not only outside dimensions." }] },
  "too small": { theme: "内部容量不足", actions: [{ type: "产品", text: "增加弹性网袋和防掉落挡边，减少线材滑出。" }, { type: "验证", text: "用 20 个样品验证适配器装入率和线材掉落率。" }] },
  "防水": { theme: "防水性能", actions: [{ type: "产品", text: "增加独立线材防掉落，标注测试条件。" }, { type: "供应链", text: "确认防水面料等级和工艺证书。" }] },
  "waterproof": { theme: "Water resistance", actions: [{ type: "产品", text: "Add independent wet zone with verified water resistance." }, { type: "供应链", text: "Confirm fabric waterproof rating and certifications." }] },
  "噪音": { theme: "噪音控制", actions: [{ type: "产品", text: "优化电机和风叶设计，降低高频噪音。" }, { type: "验证", text: "对比竞品分贝值，标注实测噪音范围。" }] },
  "noisy": { theme: "Noise control", actions: [{ type: "产品", text: "Optimize motor and blade design to reduce noise." }, { type: "验证", text: "Compare dB levels with competitors, show real range." }] },
  "锁扣": { theme: "锁扣耐用性", actions: [{ type: "产品", text: "升级锁扣材质和弹簧结构，展示开合测试。" }, { type: "验证", text: "30 次开合后锁扣无松动，退货率低于 8%。" }] },
  "洗": { theme: "清洗便利性", actions: [{ type: "产品", text: "改为可拆洗设计，减少藏污结构。" }, { type: "验证", text: "短鼻犬试用 20 次，清洗差评明显下降。" }] },
  "便宜": { theme: "质感升级", actions: [{ type: "供应链", text: "锁定可承受的材料升级上限，反推采购成本。" }, { type: "利润", text: "按目标售价测算毛利空间和材料升级预算。" }] },
  "cheap": { theme: "Quality upgrade", actions: [{ type: "供应链", text: "Find affordable material upgrade options, back into cost." }, { type: "利润", text: "Calculate margin space and upgrade budget from target price." }] }
};

const RISK_TEMPLATES = [
  "口袋尺寸必须用实物适配器实测，不得只写外部尺寸。",
  "售价假设需要反推采购、头程、FBA 和退货成本。",
  "涉及内部分隔和弹力带改款，先小样确认，再进入大货询价。",
  "防水需明确测试条件，不能直接写 waterproof guarantee。",
  "评价壁垒偏高，新品应切入细分而非正面竞争。",
  "材料升级成本需控制在售价可承受范围内。",
  "合规要求需提前确认（CPSIA/CPC/Prop 65）。",
  "竞品头部已积累大量评价，新品需要差异化切入点。"
];

export function detectPainPoints(text) {
  const lower = String(text || "").toLowerCase();
  const hits = [];
  for (const [keyword, data] of Object.entries(PAIN_KEYWORDS)) {
    if (lower.includes(keyword.toLowerCase())) hits.push({ keyword, ...data });
  }
  return hits;
}

export function generateLocalAnalysis(evidence, context = {}, retryNote = "") {
  const text = String(evidence || "");
  const pains = detectPainPoints(text);
  const hasPains = pains.length > 0;
  const hasEnough = text.length >= 30;
  const hasRetry = Boolean(retryNote);

  let score, confidence, decision;
  if (hasRetry) { score = 74; confidence = 72; decision = "小样验证"; }
  else if (hasPains && !hasEnough) { score = 72; confidence = 66; decision = "小样验证"; }
  else if (!hasEnough) { score = 52; confidence = 48; decision = "暂缓"; }
  else if (hasPains && pains.length >= 2) { score = 82 + Math.min(8, pains.length * 2); confidence = 84 + Math.min(10, pains.length * 2); decision = "小样验证"; }
  else if (hasPains) { score = 76; confidence = 78; decision = "小样验证"; }
  else { score = 68; confidence = 62; decision = "暂缓"; }
  score = Math.min(95, score);
  confidence = Math.min(95, confidence);

  const themes = hasPains ? pains.map(p => p.theme) : ["基础体验"];
  const titlePrefix = themes.slice(0, 2).join(" + ");

  const insight = hasRetry
    ? "重算后发现，当前证据不足以支持直接改款；先验证核心痛点的真实频率，再决定是否扩展功能。"
    : hasPains
      ? `海外用户反复抱怨"${themes[0]}"，真正值得验证的是${pains.map(p => p.keyword).slice(0, 3).join("、")}的改进版本。国内内容在卖"颜值和概念"，海外用户真正付费的是"可验证的品质"。`
      : "当前评论证据不足以判断明确机会方向。建议先补充更多评论和搜索词数据，再做选品决策。";

  const actions = [];
  if (hasPains) {
    const seen = new Set();
    for (const pain of pains) {
      for (const action of pain.actions) {
        const key = action.type + action.text;
        if (!seen.has(key)) { seen.add(key); actions.push(action); }
        if (actions.length >= 3) break;
      }
      if (actions.length >= 3) break;
    }
  }
  while (actions.length < 3) {
    const fallback = [
      { type: "产品", text: "根据差评聚类结果，做针对性改款，先做 2 个样品。" },
      { type: "利润", text: "按目标售价测算毛利空间，锁定可承受的材料升级上限。" },
      { type: "验证", text: "先测 20 个样品，观察退货原因和 1 星评论是否下降。" }
    ];
    actions.push(fallback[actions.length]);
  }

  const risks = [];
  const riskIndices = hasRetry ? [0, 2, 4] : hasPains ? [0, 1, 2] : [1, 6, 7];
  for (const idx of riskIndices) {
    if (risks.length < 3) risks.push(RISK_TEMPLATES[idx % RISK_TEMPLATES.length]);
  }

  const contextTitle = context && typeof context === "object" && context.title ? `（${context.title}）` : "";
  return {
    score, confidence, decision,
    title: `${titlePrefix}：${decision}${contextTitle}`,
    insight, actions, risks
  };
}

// 把机会卡格式化成人类可读的文本卡片（CLI 输出用）
export function formatCard(analysis, meta = {}) {
  const lines = [];
  lines.push("┌─────────────── 选品机会卡 ───────────────");
  if (meta.title || meta.source) lines.push(`│ 产品线索：${meta.source || "未知来源"} · ${meta.title || "未命名"}`);
  lines.push(`│ 综合评分：${analysis.score} / 100    证据强度：${analysis.confidence}%`);
  lines.push(`│ 决策结论：${analysis.decision}`);
  lines.push(`│ 机会标题：${analysis.title}`);
  lines.push(`│ 核心洞察：${analysis.insight}`);
  lines.push("│ 行动项：");
  for (const action of analysis.actions) lines.push(`│   [${action.type}] ${action.text}`);
  lines.push("│ 风险提醒：");
  for (const risk of analysis.risks) lines.push(`│   - ${risk}`);
  lines.push("└───────────────────────────────────────────");
  return lines.join("\n");
}
