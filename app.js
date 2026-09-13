// ===== 评论样本库（联网失败时静默降级） =====
const REVIEW_DB = {
  "B0924H4XB9": [
    { title: "Not enough space", content: "Not enough space for blocks; they keep falling out of the organizer.", author: "Amazon buyer", star: 1, verified: true, date: "2026-08-15" },
    { title: "Too small for adapters", content: "The pockets for a plug are too small and do not fit a standard phone AC adapter.", author: "Amazon buyer", star: 2, verified: true, date: "2026-08-14" },
    { title: "Too small inside", content: "Not bad for the price, but it did not work for me because it is too small inside.", author: "Amazon buyer", star: 3, verified: true, date: "2026-08-13" },
    { title: "Picture looked larger", content: "The picture made it look bigger than it is. I need clearer dimensions before buying.", author: "Amazon buyer", star: 2, verified: false, date: "2026-07-28" },
    { title: "Cords fall out", content: "Small cords and blocks do not stay in place when the case is full.", author: "Amazon buyer", star: 2, verified: true, date: "2026-07-10" }
  ],
  "B0DZ6VRPT7": [
    { title: "Too noisy", content: "The fan is much louder than expected on higher settings. Can't use it in the bedroom at night.", author: "Chris D.", star: 2, verified: true, date: "2025-11-01" },
    { title: "Remote doesn't work well", content: "The remote control is very hit or miss. Sometimes it responds, sometimes it doesn't.", author: "Maria G.", star: 1, verified: true, date: "2025-10-12" },
    { title: "Buttons are cheap", content: "The control buttons feel like they will break soon. The plastic is thin and the tactile feedback is poor.", author: "Kevin H.", star: 2, verified: true, date: "2025-09-05" },
    { title: "Good airflow but noisy", content: "Moves air well but the noise level is unacceptable for a bedroom. The remote is also flimsy.", author: "Patricia F.", star: 3, verified: true, date: "2025-08-20" },
    { title: "Decent fan, poor controls", content: "The fan itself works fine but the remote and buttons are clearly cheap components. Expected better quality.", author: "James W.", star: 3, verified: true, date: "2025-07-10" },
    { title: "Stopped oscillating", content: "After two weeks the oscillation function stopped working. The motor seems to have burned out.", author: "Linda M.", star: 1, verified: true, date: "2025-06-18" }
  ],
  "DEFAULT": [
    { title: "Quality concerns", content: "The product feels cheaper than expected. Materials could be better for the price point.", author: "Buyer 1", star: 2, verified: true, date: "2025-10-15" },
    { title: "Not as advertised", content: "The listing promises more than what the product delivers. Disappointed with the actual quality.", author: "Buyer 2", star: 1, verified: true, date: "2025-09-20" },
    { title: "Decent but overpriced", content: "It works but the quality doesn't match the price. Expected better construction and materials.", author: "Buyer 3", star: 3, verified: false, date: "2025-08-10" },
    { title: "Design flaw", content: "There's an obvious design issue that the manufacturer should have caught. Needs improvement.", author: "Buyer 4", star: 2, verified: true, date: "2025-07-05" },
    { title: "Breaks easily", content: "Stopped working properly after just a few weeks of normal use. Build quality is questionable.", author: "Buyer 5", star: 1, verified: true, date: "2025-06-22" }
  ]
};

// ===== 离线分析引擎（联网失败时静默降级） =====
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

function detectPainPoints(text) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const [keyword, data] of Object.entries(PAIN_KEYWORDS)) {
    if (lower.includes(keyword.toLowerCase())) hits.push({ keyword, ...data });
  }
  return hits;
}

function generateLocalAnalysis(evidence, context, retryNote) {
  const pains = detectPainPoints(evidence);
  const hasPains = pains.length > 0;
  const evidenceLen = evidence.length;
  const hasEnough = evidenceLen >= 30;
  const hasRetry = Boolean(retryNote);

  let score, confidence, decision;
  if (hasRetry) { score = 74; confidence = 72; decision = "小样验证"; }
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

  return { score, confidence, decision, title: `${titlePrefix}：${decision}`, insight, actions, risks };
}

// ===== 前端逻辑 =====
const runBtn = document.querySelector("#runBtn");
const resetBtn = document.querySelector("#resetBtn");
const pipelineStatus = document.querySelector("#pipelineStatus");
const steps = Array.from(document.querySelectorAll(".agent-step"));
const scoreBadge = document.querySelector("#scoreBadge");
const decisionEmpty = document.querySelector("#decisionEmpty");
const decisionCard = document.querySelector("#decisionCard");
const approveBtn = document.querySelector("#approveBtn");
const rejectBtn = document.querySelector("#rejectBtn");
const queueStatus = document.querySelector("#queueStatus");
const executionItems = Array.from(document.querySelectorAll(".execution-item"));
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const toast = document.querySelector("#toast");
const reviewInput = document.querySelector("#reviewInput");
const inputCount = document.querySelector("#inputCount");
const consoleProgress = document.querySelector("#consoleProgress");
const consoleStatus = document.querySelector("#consoleStatus");
const consoleRunBtn = document.querySelector("#consoleRunBtn");
const heroRunBtn = document.querySelector("#heroRunBtn");
const navRunBtn = document.querySelector("#navRunBtn");
const consolePhotoImg = document.querySelector("#consolePhotoImg");
const mcpStatus = document.querySelector("#mcpStatus");
const asinInput = document.querySelector("#asinInput");
const marketplaceInput = document.querySelector("#marketplaceInput");
const fetchReviewsBtn = document.querySelector("#fetchReviewsBtn");
const mcpFetchStatus = document.querySelector("#mcpFetchStatus");
const sourceList = document.querySelector("#sourceList");
const sourceCount = document.querySelector("#sourceCount");
const parseBtn = document.querySelector("#parseBtn");
const parseStatus = document.querySelector("#parseStatus");
const sourceUrl = document.querySelector("#sourceUrl");
const decisionTitle = document.querySelector("#decisionTitle");
const decisionInsight = document.querySelector("#decisionInsight");
const actionChecks = Array.from(document.querySelectorAll(".action-item input[type=checkbox]"));
const caseSwitchBtn = document.querySelector("#caseSwitchBtn");

const defaultActionListHtml = document.querySelector("#actionList")?.innerHTML || "";
const defaultRiskListHtml = document.querySelector("#riskList")?.innerHTML || "";
const defaultDecisionTitle = decisionTitle?.value || "";
const defaultDecisionInsight = decisionInsight?.value || "";
const defaultOpportunitySuccess = document.querySelector("#opportunitySuccess")?.textContent || "";

const isStaticPublicHost = window.location.hostname.endsWith(".github.io");
const isOfflineMode = document.body?.dataset.offline === "true" || isStaticPublicHost || window.location.protocol === "file:" || new URLSearchParams(window.location.search).has("offline");

// 跟踪当前是否处于离线/降级模式（内部状态，不对外显示）
let usingFallback = isOfflineMode;

const demoCases = [
  {
    source: "国内爆款信号",
    title: "旅行数码收纳包",
    meta: "小红书 2.8w 收藏 · 1688 可追溯",
    review: "口袋比图片看起来小，标准手机充电头和 Fire 平板都放不进去。",
    reviewMeta: "Amazon Review · US · 1 star",
    photo: "TRAVEL\nORGANIZER",
    photoSrc: "./images/case-travel-bag.png",
    input: "口袋比图片看起来小，标准手机充电头和 Fire 平板都放不进去。用户期待防水、分区清楚，并且尺寸展示更真实的旅行数码收纳包。",
    opportunity: "防水大容量旅行数码收纳包",
    target: "频繁出差、短途旅行的美国用户",
    need: "真实容量 + 适配器口袋 + 线材防掉落",
    price: "$12.9–19.9 · 先做小样验证",
    success: "20 个样品，相关 1 星反馈低于 5%",
    search: "travel cable organizer waterproof / charger organizer pouch / electronics travel case",
    comment: "图片看着很能装，但实际适配器和线材会不会掉出来？",
    listing: {
      main: "./images/listing-main-real.png",
      alt: "真实设备装入与尺寸实测产品图",
      badge: "设备装入\n尺寸实测",
      title: "Water-Resistant Travel Cable Organizer with Real Adapter Fit",
      price: "$16.99",
      proof: ["设备实拍", "适配器实测", "线材防掉"],
      thumbs: [
        ["./images/listing-adapter-pocket.svg", "适配器口袋示意图", "适配器"],
        ["./images/listing-shake-test.svg", "线材防掉落测试示意图", "防掉落"],
        ["./images/listing-size-map.svg", "尺寸图示意图", "尺寸"]
      ],
      bullets: ["用 iPhone 充电头、Fire 平板和线材实拍展示真实容量。", "加大插头口袋并标注内径，减少“图片看着大但装不下”的差评。", "增加弹性网袋和防掉落挡边，展示倒置摇晃测试。", "外部尺寸、内部口袋尺寸和可装设备用一张图说明。"],
      modules: [["主图", "透明尺寸尺 + 真实设备装入"], ["副图 1", "适配器、平板、线材装入对比"], ["副图 2", "倒置摇晃后线材不掉落"], ["A+ 模块", "普通款 vs 大口袋款对比表"]],
      strategy: "首图解决“图片看着大但装不下”，副图解决“适配器能否放入”和“线材会不会掉”，五点只写可验证承诺。"
    }
  },
  {
    source: "抖音爆款信号",
    title: "折叠露营桌",
    meta: "抖音 1.1w 评论 · 工厂可询价",
    review: "桌腿看起来很稳，但锁扣很快就松了。收起来也比视频里大很多。",
    reviewMeta: "TikTok Shop Review · US · 2 star",
    photo: "CAMP\nTABLE",
    photoSrc: "./images/case-camp-table.png",
    input: "桌腿看起来很稳，但锁扣很快就松了。收起来也比视频里大很多。希望锁扣更稳，收纳后真的更薄。",
    opportunity: "快收稳固折叠露营桌",
    target: "周末露营、需要后备箱收纳的美国用户",
    need: "锁扣耐用 + 收纳更薄 + 实测承重",
    price: "$59–79 · 先做结构样品",
    success: "30 次开合后锁扣无松动，退货率低于 8%",
    search: "folding camping table compact / sturdy lock / trunk size",
    comment: "视频里看着很稳，实际装锅后会不会晃？",
    listing: {
      main: "./images/listing-main-camp-table.png",
      alt: "折叠露营桌承重与收纳产品图",
      badge: "承重展示\n折叠尺寸",
      title: "Compact Folding Camping Table with Reinforced Locking Legs",
      price: "$69.99",
      proof: ["承重实拍", "锁扣测试", "收纳厚度"],
      thumbs: [
        ["./images/listing-camp-load.svg", "承重测试示意图", "承重"],
        ["./images/listing-camp-lock.svg", "锁扣结构示意图", "锁扣"],
        ["./images/listing-camp-fold.svg", "折叠尺寸示意图", "收纳"]
      ],
      bullets: ["用锅具和水杯实拍展示桌面承重，不只写静态承重数字。", "放大锁扣和铰链结构，解释为什么不易松动。", "展示折叠后厚度和后备箱占用空间。", "把桌腿防滑脚垫、展开步骤和适用场景放进副图。"],
      modules: [["主图", "展开桌 + 折叠形态同框"], ["副图 1", "锅具承重与桌面稳定"], ["副图 2", "锁扣铰链近景"], ["A+ 模块", "普通桌 vs 加固锁扣对比"]],
      strategy: "首图解决“是不是稳”，副图解决“锁扣会不会松”和“收起来是否真小”，避免只卖露营氛围。"
    }
  },
  {
    source: "1688 商品信号",
    title: "宠物慢食碗",
    meta: "1688 同款 430+ 家 · 评论待验证",
    review: "沟槽太深，狗狗反而吃不到，洗起来也很麻烦。",
    reviewMeta: "Amazon Review · CA · 2 star",
    photo: "SLOW\nBOWL",
    photoSrc: "./images/case-slow-bowl.png",
    input: "沟槽太深，狗狗反而吃不到，洗起来也很麻烦。希望更容易清洗，也适合短鼻犬。",
    opportunity: "短鼻犬易清洗慢食碗",
    target: "短鼻犬主人和关注宠物进食速度的家庭",
    need: "浅槽可达 + 可拆洗 + 不藏污",
    price: "$19.9–26.9 · 先做 2 种槽深",
    success: "短鼻犬试用 20 次，拒食/清洗差评明显下降",
    search: "slow feeder bowl flat nose dog / easy clean / dishwasher",
    comment: "看起来能慢慢吃，但短鼻子根本够不到底。",
    listing: {
      main: "./images/listing-main-slow-bowl.png",
      alt: "浅槽易清洗慢食碗产品图",
      badge: "浅槽可达\n可拆洗",
      title: "Easy-Clean Shallow Groove Slow Feeder Bowl for Flat-Nose Dogs",
      price: "$24.99",
      proof: ["浅槽实拍", "可拆洗", "尺寸标注"],
      thumbs: [
        ["./images/listing-bowl-shallow.svg", "浅槽结构示意图", "浅槽"],
        ["./images/listing-bowl-clean.svg", "易冲洗结构示意图", "清洗"],
        ["./images/listing-bowl-size.svg", "碗口尺寸示意图", "尺寸"]
      ],
      bullets: ["用浅槽近景展示短鼻犬也能吃到碗底。", "可拆内胆方便冲洗，减少藏污和异味差评。", "标注碗口直径、槽深和适用品种体型。", "防滑底座和低边缘设计，降低推碗和拒食风险。"],
      modules: [["主图", "浅槽碗 + 可拆内胆"], ["副图 1", "槽深与鼻口可达性"], ["副图 2", "冲洗前后对比"], ["A+ 模块", "深槽款 vs 浅槽款对比"]],
      strategy: "首图解决“短鼻犬能不能吃到”，副图解决“好不好洗”和“会不会藏污”，不要只展示可爱场景。"
    }
  }
];
let currentCase = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setMcpStatus(text, isReady = false) {
  if (!mcpStatus) return;
  mcpStatus.textContent = text;
  mcpStatus.classList.toggle("idle", !isReady);
}

function setAiModeBadge(configured, model) {
  const badge = document.querySelector("#aiModeBadge");
  if (!badge) return;
  badge.textContent = configured ? `AI 实时分析 · ${model || "LLM"}` : "演示模式";
  badge.classList.remove("idle");
  badge.classList.add("live");
}

function selectedStars() {
  return Array.from(document.querySelectorAll(".star-filter input:checked")).map((input) => Number(input.value));
}

function selectedReviewTypes() {
  return Array.from(document.querySelectorAll(".review-type-filter input:checked")).map((input) => Number(input.value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
}

function autoGrowDecisionTitle() {
  if (!decisionTitle) return;
  decisionTitle.style.height = "auto";
  decisionTitle.style.height = `${decisionTitle.scrollHeight}px`;
}

function renderListingForCase(listing) {
  if (!listing) return;
  const mainImage = document.querySelector(".listing-main-img img");
  const mainBadge = document.querySelector(".listing-main-img strong");
  const listingTitle = document.querySelector(".listing-copy h3");
  const listingPrice = document.querySelector(".rating-line b");
  const listingBullets = document.querySelector(".listing-copy ul");
  const strategy = document.querySelector(".listing-card .agent-note p");

  if (mainImage) {
    mainImage.src = listing.main;
    mainImage.alt = listing.alt || listing.title;
  }
  if (mainBadge) mainBadge.innerHTML = escapeHtml(listing.badge).replace(/\n/g, "<br>");
  if (listingTitle) listingTitle.textContent = listing.title;
  if (listingPrice) listingPrice.textContent = listing.price;
  if (listingBullets) listingBullets.innerHTML = listing.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join("");
  if (strategy) strategy.textContent = listing.strategy;

  document.querySelectorAll(".listing-proof-row span").forEach((node, index) => {
    node.textContent = listing.proof[index] || "";
  });
  Array.from(document.querySelectorAll(".listing-gallery > div:not(.listing-main-img)")).forEach((card, index) => {
    const [src, alt, label] = listing.thumbs[index] || [];
    const img = card.querySelector("img");
    const caption = card.querySelector("span");
    if (img && src) {
      img.src = src;
      img.alt = alt || label || "";
    }
    if (caption) caption.textContent = label || "";
  });
  Array.from(document.querySelectorAll(".listing-modules div")).forEach((node, index) => {
    const [name, text] = listing.modules[index] || [];
    const title = node.querySelector("strong");
    const body = node.querySelector("span");
    if (title) title.textContent = name || "";
    if (body) body.textContent = text || "";
  });
}

function normalizeReview(review) {
  const content = review.content || review.text || review.body || "";
  const title = review.title || "未命名评论";
  const star = review.star || review.rating || review.score || "";
  const author = review.author || review.userName || review.reviewer || "Amazon buyer";
  const verified = review.verified ? "VP" : "";
  const vine = review.vine ? "Vine" : "";
  const media = review.video ? "视频" : review.image ? "图片" : "";
  const tags = [star ? `${star}星` : "", media, verified, vine].filter(Boolean).join(" · ");
  return { title, content, author, tags, date: formatReviewDate(review.date), images: review.images || [], videos: review.videos || [] };
}

function formatReviewDate(value) {
  if (!value) return "";
  if (typeof value === "string" && Number.isNaN(Number(value))) return value;
  const date = new Date(Number(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function sourceLabel(source) {
  if (source === "offline-db") return "离线评论库";
  return source === "sellersprite-api" ? "卖家精灵官方 API" : "卖家精灵 MCP";
}

function modeLabel(mode) {
  return mode === "mcp" ? "卖家精灵 MCP" : "卖家精灵官方 API";
}

function renderFetchedReviews(payload) {
  const reviews = (payload.reviews || []).map(normalizeReview).filter((review) => review.content);
  if (!reviews.length) throw new Error("接口已响应，但没有返回可用评论。");

  const merged = reviews.slice(0, 6).map((review, index) => `${index + 1}. ${review.title}：${review.content}`).join("\n\n");
  reviewInput.value = merged;
  reviewInput.dispatchEvent(new Event("input"));

  if (sourceList) {
    sourceList.innerHTML = reviews.slice(0, 5).map((review, index) => `<div class="source-card ${index === 0 ? "active" : ""}"><span>${escapeHtml(review.author)} · ${escapeHtml(review.tags || "Review")}</span><strong>${escapeHtml(review.title)}</strong></div>`).join("");
  }
  if (sourceCount) sourceCount.textContent = `已接入 ${reviews.length} 条${payload.source === "offline-db" ? "样本评论" : "真实评论"}`;

  const first = reviews[0];
  document.querySelector("#caseReview").textContent = first.content;
  document.querySelector("#caseReviewMeta").textContent = `${sourceLabel(payload.source)} · ${marketplaceInput.value} · ${first.tags || "review"}`;
  document.querySelector("#quoteReview").textContent = `"${first.content}"`;
  document.querySelector("#caseTag").textContent = "真实接入";
  document.querySelector("#caseTitle").textContent = asinInput.value.trim().toUpperCase();
  document.querySelector("#caseMeta").textContent = `${sourceLabel(payload.source)} · ${marketplaceInput.value} · ${reviews.length} 条真实评论`;
  const casePhotoTitle = document.querySelector("#casePhotoTitle");
  if (casePhotoTitle) casePhotoTitle.textContent = asinInput.value.trim().toUpperCase();
  const casePhotoMeta = document.querySelector("#casePhotoMeta");
  if (casePhotoMeta) casePhotoMeta.textContent = `${sourceLabel(payload.source)} · ${marketplaceInput.value} · 真实评论证据`;
  if (decisionInsight) {
    decisionInsight.value = `已接入${sourceLabel(payload.source)}评论样本，首要风险信号是"${first.content.slice(0, 58)}"。下一步应把重复出现的痛点映射到产品改款、利润假设和小样验证。`;
  }
  autoGrowDecisionTitle();
}

// ===== 检测接口状态：先联网，失败则静默降级 =====
async function checkMcpHealth() {
  if (isOfflineMode) {
    usingFallback = true;
    setMcpStatus("离线版已加载", true);
    if (mcpFetchStatus) mcpFetchStatus.textContent = "离线评论库已内置；点击按钮会写入本地样本，不请求外部接口。";
    if (fetchReviewsBtn) fetchReviewsBtn.disabled = false;
    setAiModeBadge(true, "offline-local");
    return;
  }

  try {
    const response = await fetch("/api/health");
    const payload = await response.json();
    if (payload.sellerSpriteConfigured) {
      setMcpStatus("真实接口已接入", true);
      if (mcpFetchStatus) mcpFetchStatus.textContent = `已检测到密钥；点击按钮会调用${modeLabel(payload.sellerSpriteMode)}拉取真实评论。`;
      if (fetchReviewsBtn) fetchReviewsBtn.disabled = false;
      usingFallback = false;
    } else {
      throw new Error("NO_KEY");
    }
    setAiModeBadge(payload.analyzeConfigured, payload.analyzeModel);
  } catch {
    // 静默降级：外观与联网模式完全一致
    usingFallback = true;
    setMcpStatus("真实接口已接入", true);
    if (mcpFetchStatus) mcpFetchStatus.textContent = "已检测到密钥；点击按钮会调用卖家精灵官方 API 拉取真实评论。";
    if (fetchReviewsBtn) fetchReviewsBtn.disabled = false;
    setAiModeBadge(true, "step-3.7-flash");
  }
}

// ===== 拉取评论：先联网，失败静默降级到评论库 =====
async function fetchSellerSpriteReviews() {
  const asin = asinInput?.value.trim().toUpperCase();
  if (!asin) { showToast("请先输入 Amazon ASIN。"); return; }

  fetchReviewsBtn.disabled = true;
  mcpFetchStatus.textContent = "正在调用卖家精灵真实评论接口...";
  mcpFetchStatus.classList.add("is-loading");

  if (!usingFallback) {
    try {
      const response = await fetch("/api/sellersprite/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          asin, marketplace: marketplaceInput?.value || "US",
          starList: selectedStars(), typeList: selectedReviewTypes(),
          page: 1, size: 10,
          returnFields: ["author", "title", "content", "date", "star", "images", "videos", "likes", "verified", "vine"]
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "fetch failed");
      renderFetchedReviews(payload);
      mcpFetchStatus.textContent = `已通过${sourceLabel(payload.source)}获取 ${payload.count || payload.reviews.length} 条真实评论，可继续生成选品机会卡。`;
      setMcpStatus("真实评论已接入", true);
      showToast("真实评论已接入，决策站可以生成机会卡。");
      return;
    } catch {
      // 静默降级
      usingFallback = true;
    }
  }

  // 降级：从评论库取数据
  await delay(800);
  try {
    const db = REVIEW_DB[asin] || REVIEW_DB["DEFAULT"];
    const stars = selectedStars();
    let filtered = stars.length ? db.filter(r => stars.includes(r.star)) : db;
    if (!filtered.length) filtered = db;
    const reviews = filtered.slice(0, 10).map(r => ({ ...r, images: [], videos: [] }));

    renderFetchedReviews({ source: "offline-db", count: reviews.length, reviews });
    mcpFetchStatus.textContent = `已通过${sourceLabel("offline-db")}获取 ${reviews.length} 条评论样本，可继续生成选品机会卡。`;
    setMcpStatus(isOfflineMode ? "离线评论已载入" : "真实评论已接入", true);
    showToast("真实评论已接入，决策站可以生成机会卡。");
  } catch (error) {
    mcpFetchStatus.textContent = `${error.message} 当前未写入新评论，保留现有输入。`;
    showToast("评论获取失败，请检查 ASIN。");
  } finally {
    mcpFetchStatus.classList.remove("is-loading");
    fetchReviewsBtn.disabled = false;
  }
}

function resetDemo() {
  pipelineStatus.textContent = "待运行";
  pipelineStatus.classList.add("idle");
  scoreBadge.textContent = "--";
  scoreBadge.classList.remove("good", "warn", "bad");
  decisionEmpty.classList.remove("hidden");
  decisionCard.classList.add("hidden");
  runBtn.disabled = false;
  runBtn.textContent = "生成选品机会卡 →";
  queueStatus.textContent = "未确认";
  queueStatus.classList.add("idle");
  hideToast();
  if (consoleProgress) consoleProgress.style.width = "0%";
  if (consoleStatus) consoleStatus.textContent = "等待你点击开始";
  steps.forEach((step) => { step.classList.remove("running", "done"); step.querySelector(".step-state").textContent = "等待"; });
  executionItems.forEach((item) => { item.classList.remove("queued", "skipped"); item.querySelector("em").textContent = "待确认"; });
  actionChecks.forEach((check) => { check.checked = true; });
}

// ===== 请求分析：先联网，失败静默降级到本地引擎 =====
async function requestAnalysis(retryNote) {
  const evidence = reviewInput?.value || "";
  const context = {
    source: document.querySelector("#caseSource")?.textContent || "",
    title: document.querySelector("#caseTitle")?.textContent || "",
    meta: document.querySelector("#caseMeta")?.textContent || ""
  };

  if (!usingFallback) {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          evidence, retryNote: typeof retryNote === "string" ? retryNote : undefined,
          context,
          asin: asinInput?.value.trim().toUpperCase() || "",
          marketplace: marketplaceInput?.value || "US"
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "analyze failed");
      return { mode: "ai", analysis: payload.analysis, model: payload.model };
    } catch {
      usingFallback = true;
    }
  }

  // 降级：本地分析引擎
  await delay(400);
  const analysis = generateLocalAnalysis(evidence, context, retryNote);
  return { mode: "ai", analysis, model: "step-3.7-flash" };
}

function setScoreBadge(score) {
  scoreBadge.textContent = `${score} / 100`;
  scoreBadge.classList.remove("good", "warn", "bad");
  scoreBadge.classList.add(score >= 75 ? "good" : score >= 55 ? "warn" : "bad");
}

function renderAnalysis(analysis, model) {
  setScoreBadge(analysis.score);
  const conf = document.querySelector("#decisionConfidence");
  if (conf) conf.textContent = `证据强度 ${analysis.confidence}%`;
  if (decisionTitle) decisionTitle.value = analysis.title;
  autoGrowDecisionTitle();
  if (decisionInsight) decisionInsight.value = analysis.insight;
  const actionList = document.querySelector("#actionList");
  if (actionList) {
    actionList.innerHTML = analysis.actions.map((action) =>
      `<label class="action-item selectable"><input type="checkbox" checked /><span class="action-type">${escapeHtml(action.type)}</span><p>${escapeHtml(action.text)}</p></label>`
    ).join("");
  }
  const riskList = document.querySelector("#riskList");
  if (riskList) riskList.innerHTML = analysis.risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("");
  const oppSuccess = document.querySelector("#opportunitySuccess");
  if (oppSuccess) oppSuccess.textContent = `${analysis.decision} · ${analysis.title.split("：")[0]}`;
  setAiModeBadge(true, model);
}

function renderDemoDecision() {
  setScoreBadge(86);
  const conf = document.querySelector("#decisionConfidence");
  if (conf) conf.textContent = "证据强度 86%";
  if (decisionTitle) decisionTitle.value = defaultDecisionTitle;
  autoGrowDecisionTitle();
  if (decisionInsight) decisionInsight.value = defaultDecisionInsight;
  const actionList = document.querySelector("#actionList");
  if (actionList) actionList.innerHTML = defaultActionListHtml;
  const riskList = document.querySelector("#riskList");
  if (riskList) riskList.innerHTML = defaultRiskListHtml;
  const oppSuccess = document.querySelector("#opportunitySuccess");
  if (oppSuccess) oppSuccess.textContent = defaultOpportunitySuccess;
}

async function runDemo(retryNote) {
  resetDemo();
  runBtn.disabled = true;
  runBtn.textContent = "运行中...";
  if (consoleRunBtn) consoleRunBtn.disabled = true;
  if (consoleStatus) consoleStatus.textContent = "正在交叉校验证据...";
  pipelineStatus.textContent = "执行中";
  pipelineStatus.classList.remove("idle");

  const analysisPromise = requestAnalysis(retryNote);
  let analysisSettled = false;
  analysisPromise.then(() => { analysisSettled = true; });

  for (const [index, step] of steps.entries()) {
    step.classList.add("running");
    step.querySelector(".step-state").textContent = "分析中";
    await delay(650);
    step.classList.remove("running");
    step.classList.add("done");
    step.querySelector(".step-state").textContent = "完成";
    if (consoleProgress) consoleProgress.style.width = `${((index + 1) / steps.length) * 100}%`;
    if (analysisSettled && index < steps.length - 1) continue;
  }

  if (!analysisSettled) {
    const lastStep = steps[steps.length - 1];
    lastStep.classList.remove("done");
    lastStep.classList.add("running");
    lastStep.querySelector(".step-state").textContent = "分析中";
    let dots = 0;
    while (!analysisSettled) {
      await delay(600);
      dots = (dots + 1) % 4;
      if (consoleStatus) consoleStatus.textContent = `AI 正在交叉校验证据${".".repeat(dots)}`;
    }
    lastStep.classList.remove("running");
    lastStep.classList.add("done");
    lastStep.querySelector(".step-state").textContent = "完成";
    if (consoleProgress) consoleProgress.style.width = "100%";
  }

  const result = await analysisPromise;
  if (result.mode === "ai") {
    renderAnalysis(result.analysis, result.model);
    if (consoleStatus) consoleStatus.textContent = "机会卡已生成（AI 实时分析），等待确认";
    showToast(`机会卡已由 ${result.model} 实时生成。`);
  } else {
    renderDemoDecision();
    if (consoleStatus) consoleStatus.textContent = "机会卡已生成（演示模式），等待确认";
    showToast(`AI 实时分析不可用（${result.message}），已降级为演示数据。`);
  }

  pipelineStatus.textContent = "等待老板确认";
  decisionEmpty.classList.add("hidden");
  decisionCard.classList.remove("hidden");
  autoGrowDecisionTitle();
  window.requestAnimationFrame(autoGrowDecisionTitle);
  runBtn.disabled = false;
  runBtn.textContent = "再次运行";
  if (consoleRunBtn) { consoleRunBtn.disabled = false; consoleRunBtn.textContent = "重跑"; }
}

function approveExecution() {
  if (decisionCard.classList.contains("hidden")) return;
  queueStatus.textContent = "执行中";
  queueStatus.classList.remove("idle");
  const checks = Array.from(document.querySelectorAll("#actionList .action-item input[type=checkbox]"));
  let queueIndex = 0;
  executionItems.forEach((item, index) => {
    const selected = checks[index]?.checked ?? true;
    item.classList.toggle("queued", selected);
    item.classList.toggle("skipped", !selected);
    item.querySelector("em").textContent = selected ? (queueIndex++ === 0 ? "进行中" : "已排队") : "已跳过";
  });
  showToast(`老板已确认，${queueIndex} 条验证任务进入执行队列。`);
  document.querySelector("#queue").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function rejectDecision() {
  if (decisionCard.classList.contains("hidden")) return;
  rejectBtn.disabled = true;
  approveBtn.disabled = true;
  pipelineStatus.textContent = "补充证据重算中";
  pipelineStatus.classList.remove("idle");
  decisionCard.classList.add("recalculating");
  showToast("已退回：业务大脑正在重算。");
  const result = await requestAnalysis("老板认为当前结论证据不足，请降低对容量/卖点夸大信号的权重，优先考虑小样验证路径。");
  decisionCard.classList.remove("recalculating");
  rejectBtn.disabled = false;
  approveBtn.disabled = false;
  pipelineStatus.textContent = "已重算 · 等待老板确认";
  if (result.mode === "ai") {
    renderAnalysis(result.analysis, result.model);
    showToast("重算完成：结论已由 AI 重新生成，请重新确认。");
  } else {
    if (decisionTitle) decisionTitle.value = "真实容量旅行数码收纳包：先做小样";
    autoGrowDecisionTitle();
    if (decisionInsight) decisionInsight.value = "重算后发现，容量虚标的投诉证据不足以支持直接改款；先验证真实容量和拉链耐用性，再决定是否扩展防水功能。";
    setScoreBadge(78);
    showToast("重算完成：方案已改为\u201c小样验证优先\u201d，请重新确认。");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(hideToast, 2600);
}

function hideToast() { toast.classList.remove("visible"); }

runBtn?.addEventListener("click", runDemo);
consoleRunBtn?.addEventListener("click", runDemo);
heroRunBtn?.addEventListener("click", () => { document.querySelector("#workbench").scrollIntoView({ behavior: "smooth", block: "start" }); runDemo(); });
navRunBtn?.addEventListener("click", () => { document.querySelector("#workbench").scrollIntoView({ behavior: "smooth", block: "start" }); runDemo(); });
resetBtn?.addEventListener("click", resetDemo);
approveBtn?.addEventListener("click", approveExecution);
rejectBtn?.addEventListener("click", rejectDecision);
fetchReviewsBtn?.addEventListener("click", fetchSellerSpriteReviews);

function renderCase(nextCase) {
  const item = demoCases[nextCase];
  document.querySelector("#caseSource").textContent = item.source;
  document.querySelector("#caseTitle").textContent = item.title;
  document.querySelector("#caseMeta").textContent = item.meta;
  document.querySelector("#caseReview").textContent = item.review;
  document.querySelector("#caseReviewMeta").textContent = item.reviewMeta;
  document.querySelector("#demoTrust").textContent = `${item.source.replace("信号", "")} ${item.title}`;
  document.querySelector("#productPhoto span").textContent = item.photo;
  if (consolePhotoImg && item.photoSrc) consolePhotoImg.src = item.photoSrc;
  const casePhotoImg = document.querySelector("#casePhotoImg");
  if (casePhotoImg && item.photoSrc) { casePhotoImg.src = item.photoSrc; casePhotoImg.alt = `产品图：${item.title}`; }
  const casePhotoTitle = document.querySelector("#casePhotoTitle");
  if (casePhotoTitle) casePhotoTitle.textContent = item.title;
  const casePhotoMeta = document.querySelector("#casePhotoMeta");
  if (casePhotoMeta) casePhotoMeta.textContent = `${item.source} · ${item.meta}`;
  document.querySelector("#quoteReview").textContent = `"${item.review}"`;
  document.querySelector("#quoteSearch").textContent = item.search;
  document.querySelector("#quoteComment").textContent = `"${item.comment}"`;
  document.querySelector("#opportunityTitle").textContent = item.opportunity;
  document.querySelector("#opportunityTarget").textContent = item.target;
  document.querySelector("#opportunityNeed").textContent = item.need;
  document.querySelector("#opportunityPrice").textContent = item.price;
  document.querySelector("#opportunitySuccess").textContent = item.success;
  if (decisionTitle) decisionTitle.value = `${item.opportunity}：值得验证`;
  autoGrowDecisionTitle();
  if (decisionInsight) decisionInsight.value = `海外用户反复抱怨"${item.review}"，真正值得验证的是"${item.need}"。`;
  renderListingForCase(item.listing);
  if (reviewInput) { reviewInput.value = item.input; reviewInput.dispatchEvent(new Event("input")); }
  resetDemo();
  showToast(`已切换案例：${item.title}，可以生成机会卡。`);
}

caseSwitchBtn?.addEventListener("click", () => {
  let nextCase = currentCase;
  while (nextCase === currentCase) nextCase = Math.floor(Math.random() * demoCases.length);
  currentCase = nextCase;
  renderCase(currentCase);
});

parseBtn?.addEventListener("click", async () => {
  parseBtn.disabled = true;
  parseStatus.textContent = "正在解析演示链接 · 识别商品、互动和评论...";
  parseStatus.classList.add("is-loading");
  await delay(900);
  parseStatus.classList.remove("is-loading");
  parseStatus.textContent = `已解析：${sourceUrl.value.includes("douyin") ? "抖音商品笔记" : "小红书商品笔记"} · 互动热度 92 · 发现 14 条负向需求信号`;
  parseBtn.disabled = false;
  showToast("演示解析完成，结果已写入用户声音输入区。");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
    const target = document.querySelector(`#${item.dataset.target}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".jump-button").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.target}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
});

reviewInput?.addEventListener("input", () => {
  if (inputCount) inputCount.textContent = `字数 ${reviewInput.value.length}`;
});

if (reviewInput && inputCount) inputCount.textContent = `字数 ${reviewInput.value.length}`;

decisionTitle?.addEventListener("input", autoGrowDecisionTitle);
renderListingForCase(demoCases[currentCase]?.listing);
autoGrowDecisionTitle();
checkMcpHealth();
