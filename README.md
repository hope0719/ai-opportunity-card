# AI 选品机会卡决策站

这是生财黑客松项目的独立演示站。当前版本已从「差评炼金」升级为「AI 选品机会卡」：保留评论/VOC 分析能力，但主叙事改为帮助老板判断一个产品方向是否值得继续做。

- `index.html`: 产品叙事与执行工作台
- `styles.css`: 页面视觉与响应式布局
- `app.js`: 案例切换、演示解析、AI 接力、机会卡重算与执行派工
- `server.js`: 本地 SellerSprite MCP/API 代理 + LLM 机会卡分析代理，负责保存密钥并转发请求
- `sellersprite-mcp.example.json`: Codex/其他 MCP 客户端可参考的卖家精灵配置

## 本地启动

不要把真实密钥写进前端或提交进项目。启动时用环境变量传入：

```bash
SELLERSPRITE_SECRET_KEY=你的密钥 ANALYZE_API_KEY=你的LLM密钥 npm run dev
```

也可以在本目录创建 `.env.local`，服务端会自动读取：

```bash
SELLERSPRITE_SECRET_KEY=你的密钥
ANALYZE_API_KEY=你的LLM密钥
ANALYZE_MODEL=step-3.7-flash            # 可选，默认 step-3.7-flash
ANALYZE_API_URL=https://api.stepfun.com/step_plan/v1/chat/completions  # 可选
```

也可以传完整 MCP 地址，服务会自动提取 `secret-key` 并清洗 URL：

```bash
SELLERSPRITE_MCP_URL="https://mcp.sellersprite.com/mcp?secret-key=你的密钥" npm run dev
```

打开 `http://localhost:5179`。

## 已接入能力

### 真实 AI 机会卡分析（本次新增）

- 点击「生成选品机会卡」后，前端调用 `POST /api/analyze`，由服务端转发给大模型（默认阶跃星辰 `step-3.7-flash`）
- LLM 基于评论证据实时输出结构化 JSON：评分（0-100）、证据强度、四选一决策（继续/暂缓/放弃/小样验证）、机会标题、核心洞察、3 条行动项、3 条风险提醒
- 前端动态渲染决策卡：评分徽章按分数变色（≥75 绿 / 55-74 黄 / <55 红），行动项可直接勾选后派工
- 「退回重算」会把老板的反馈附带给 LLM 重新生成结论
- 未配置 `ANALYZE_API_KEY` 或调用失败时，自动降级为演示数据，页面徽章显示「演示模式」/「AI 实时分析 · 模型名」
- 服务端对出站请求做了 keep-alive 断连自动重试（最多 3 次），应对代理/长连接波动

### 卖家精灵真实评论

- 前端点击"拉取真实评论"会请求本地 `/api/sellersprite/review`
- 本地服务优先调用卖家精灵官方 API `/v1/review`
- 如果官方 API 调用失败，会降级调用卖家精灵 MCP 工具 `review`
- 如果未配置密钥、接口失败或筛选无评论，页面会明确报错并保留已有输入，避免把演示数据误当真实数据
- 评论分析现在作为机会卡的证据来源之一，最终输出强调「继续 / 暂缓 / 放弃 / 小样验证」的选品决策

产品线索入口为 Amazon ASIN（真实评论拉取）+ 评论证据文本区（可直接编辑，作为 AI 机会卡分析输入）。

## 评论接口依据

- 官方评论 API：`POST https://api.sellersprite.com/v1/review`
- 必填参数：`marketplace`、`asin`
- 可选参数：`starList`、`typeList`、`page`、`size`
- `size` 最大 10；密钥必须放在固定 header `secret-key`
