---
name: opportunity-card
description: AI 选品机会卡决策站。输入亚马逊差评/评论证据，自动生成一张可拍板的选品机会卡：综合评分、四选一决策（继续/暂缓/放弃/小样验证）、机会标题、核心洞察、3 条行动项、3 条风险提醒。零依赖、零密钥、免大模型，装完即用。当用户要分析海外差评、判断产品值不值得做、生成选品机会卡、或想启动这个决策站网页时使用。
---

# AI 选品机会卡（Opportunity Card）

把一条海外差评，变成一张能拍板、能派工的选品机会卡。
**不需要任何大模型密钥即可运行**——内置本地分析引擎；接入真实数据源后能力自动增强。

## 它解决什么问题

跨境卖家看到国内爆款想跟卖，但海外用户买不买账没人知道。本工具用海外真实差评验证国内爆款信号，输出：

- 综合评分（0–100）+ 证据强度
- 四选一决策：**继续 / 暂缓 / 放弃 / 小样验证**
- 机会标题 + 核心洞察（国内内容在卖什么 vs 海外用户真正付费的是什么）
- 3 条可勾选执行的行动项（产品/利润/验证/内容/供应链）
- 3 条风险提醒（业务大脑视角）

## 快速开始（两种方式，都不需要密钥）

### 方式一：命令行（Agent 首选，秒出结果）

```bash
cd <本技能目录>

# 直接分析一条差评
node analyze.js --evidence "口袋比图片看起来小，标准充电头和平板都放不进去，拉链也很容易卡。" --title "旅行数码收纳包" --source "小红书爆款"

# 输出 JSON（供程序消费）
node analyze.js -e "拉链用了两次就卡住，容量虚标。" -t "旅行收纳包" --json

# 管道输入
echo "锁扣很快就松了，收起来比视频里大很多。" | node analyze.js --stdin

# 老板退回重算模式（降低乐观权重，更保守）
node analyze.js -e "..." -r "证据不足，优先小样验证路径"
```

要求：Node.js ≥ 18。**无任何 npm 依赖，禁止运行 npm install**。

### 方式二：启动本地网页（给人看的完整工作台）

```bash
node server.js
# 打开 http://localhost:5179
```

网页版含完整流程：产品线索 + 评论证据输入 → 4 个 Agent 接力动画 → 机会卡生成 → 老板编辑/勾选 → 确认派工 → 执行队列（供应链询价/竞品审核/Listing 草稿）。
停止服务：`lsof -ti:5179 | xargs kill`。端口冲突时 `PORT=3000 node server.js`。

## Agent 调用指引

1. 用户给差评文本/产品名 → 直接用方式一 CLI 出卡，把结果格式化回复
2. 用户要看完整界面/演示 → 用方式二起服务（后台运行），给出 http://localhost:5179
3. API 调用（服务已启动时）：

```bash
curl -X POST http://localhost:5179/api/analyze -H "content-type: application/json" \
  -d '{"evidence":"差评文本","context":{"source":"小红书爆款","title":"旅行收纳包"}}'
# 返回 { ok, engine: "local"|"llm", model, analysis: { score, confidence, decision, title, insight, actions[], risks[] } }
```

健康检查：`curl http://localhost:5179/api/health`（返回各数据源配置状态，agent 可据此告知用户当前模式）。

## 数据接入点指南（接什么、在哪接、带来什么提升）

**默认全部不接也能用**：本地引擎 + 预置演示案例开箱即跑。以下接入点按「性价比」排序：

### 接入点 1：真实亚马逊评论（性价比最高 ⭐⭐⭐）

- **在哪接**：技能目录下创建 `.env.local`，写入 `SELLERSPRITE_SECRET_KEY=你的密钥`（卖家精灵，国内跨境圈普及率高）
- **带来什么**：网页版「拉取真实评论」按钮激活——输入任意 ASIN 实时拉取该商品真实差评，自动清洗后填入证据区，替代手抄差评
- **API**：`POST /api/sellersprite/review`，参数 `{ "asin": "B0XXXXXXXX", "marketplace": "US", "starList": [1,2] }`
- 不接：评论区使用内置演示样本，手动粘贴差评文本同样可分析

### 接入点 2：大模型分析引擎（质量增强 ⭐⭐）

- **在哪接**：`.env.local` 写入三行（任何 OpenAI 兼容接口都行）：
  ```
  ANALYZE_API_KEY=你的密钥
  ANALYZE_API_URL=https://api.stepfun.com/step_plan/v1/chat/completions
  ANALYZE_MODEL=step-3.7-flash
  ```
- **带来什么**：分析从规则引擎升级为 LLM 实时推理——洞察更贴合证据语境、行动项更具体、能处理规则库没覆盖的品类；LLM 调用失败时自动降级回本地引擎，永不断服务
- **强制本地**：`ANALYZE_ENGINE=local node server.js`（即使配了密钥也不用大模型）
- 不接：本地规则引擎照常出卡（含 15+ 痛点关键词库：拉链/容量/口袋/防水/锁扣/噪音/清洗等，中英双语识别）

### 接入点 3：国内爆款信号源（小红书/抖音，进阶 ⭐）

- **在哪接**：`app.js` 中 STEP 01 输入区预留了证据文本入口，任何能产出「差评/诉求文本」的解析服务（自建爬虫、第三方解析 API）输出直接填入即可；服务端可仿照 sellersprite 路由新增 `/api/parse` 端点
- **带来什么**：从「手动贴差评」升级为「贴一个笔记链接自动解析商品+评论」
- 不接：手动输入差评文本（演示与真实分析均不受影响）

### 接入点 4：执行层真实入口（1688/Amazon/TikTok）

- **在哪接**：网页版执行队列已内置 1688 询价、Amazon 竞品、TikTok 内容的真实工作页外链，无需配置
- **带来什么**：机会卡确认后一键跳转真实采购/上架/投放页面，闭环「决策→执行」

## 文件结构

```
SKILL.md            本文件（技能入口）
analyze.js          命令行出卡工具（零密钥）
local-engine.js     本地分析引擎（规则库 + 评分逻辑，零依赖）
server.js           本地服务（网页版 + API + 密钥保管代理）
index.html          网页版界面（叙事 + 工作台）
app.js              网页版逻辑（含降级到本地引擎的前端副本）
styles.css          样式
images/             演示案例产品图
.env.example        环境变量模板（各接入点说明）
offline.html        纯离线单文件版（可 file:// 双击打开）
```

## 安装方式

- **WorkBuddy**：把整个文件夹复制到 `~/.workbuddy/skills/opportunity-card/`
- **Claude Code / 通用 Agent**：复制到对应 skills 目录（如 `~/.claude/skills/`）
- 装完后对 Agent 说「分析这条差评」或「启动选品机会卡」即可触发

## 注意事项

- `.env.local` 存放密钥且已被 `.gitignore` 排除，**永远不会被提交/分发**——分发本技能给别人时密钥不会泄露
- 评分规则参考：≥75 值得推进（绿）、55–74 谨慎（黄）、<55 不建议（红）
- 本地引擎的结论必须与证据一致，证据不足时宁可给「小样验证」或「暂缓」，不盲目乐观
