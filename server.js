import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadLocalEnv();

const port = Number(process.env.PORT || 5179);
const configuredMcpUrl = new URL(process.env.SELLERSPRITE_MCP_URL || "https://mcp.sellersprite.com/mcp");
const secretFromMcpUrl = configuredMcpUrl.searchParams.get("secret-key") || "";
configuredMcpUrl.searchParams.delete("secret-key");
const sellerSpriteSecret = process.env.SELLERSPRITE_SECRET_KEY || secretFromMcpUrl;
const sellerSpriteMcpUrl = configuredMcpUrl.toString();
const sellerSpriteApiUrl = process.env.SELLERSPRITE_API_URL || "https://api.sellersprite.com";
const preferSellerSpriteMcp = Boolean(secretFromMcpUrl && !process.env.SELLERSPRITE_SECRET_KEY);

const analyzeModel = process.env.ANALYZE_MODEL || "step-3.7-flash";
const analyzeApiUrl = process.env.ANALYZE_API_URL || "https://api.stepfun.com/step_plan/v1/chat/completions";
const analyzeApiKey = process.env.ANALYZE_API_KEY || "";

const staticTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) return;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sellerSpriteHeaders() {
  return {
    "content-type": "application/json;charset=utf-8",
    accept: "application/json",
    "secret-key": sellerSpriteSecret
  };
}

function cleanReviewArgs(input) {
  const starList = Array.isArray(input.starList)
    ? input.starList.map(Number).filter((star) => star >= 1 && star <= 5)
    : undefined;
  const typeList = Array.isArray(input.typeList)
    ? input.typeList.map(Number).filter((type) => type >= 1 && type <= 4)
    : undefined;

  return {
    marketplace: String(input.marketplace || "US").toUpperCase(),
    asin: String(input.asin || "").trim().toUpperCase(),
    ...(starList?.length ? { starList } : {}),
    ...(typeList?.length ? { typeList } : {}),
    page: Math.max(1, Number(input.page || 1)),
    size: Math.min(10, Math.max(1, Number(input.size || 10))),
    returnFields: Array.isArray(input.returnFields) && input.returnFields.length ? input.returnFields : [
      "author",
      "title",
      "content",
      "date",
      "star",
      "skus",
      "images",
      "videos",
      "likes",
      "verified",
      "vine"
    ]
  };
}

const RETRYABLE_SOCKET_CODES = new Set(["UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT", "ECONNRESET", "EPIPE", "ETIMEDOUT"]);

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    try {
      return await fetch(url, { ...options, keepalive: false });
    } catch (error) {
      lastError = error;
      const code = error.cause?.code || "";
      const isSocketFlake = error.message === "fetch failed" || RETRYABLE_SOCKET_CODES.has(code);
      if (!isSocketFlake) throw error;
    }
  }
  throw lastError;
}

async function callSellerSpriteMcp(toolName, args) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetchWithRetry(sellerSpriteMcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "secret-key": sellerSpriteSecret
      },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      })
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  if (!response.ok) throw new Error(`SellerSprite MCP HTTP ${response.status}: ${text.slice(0, 300)}`);

  const payload = parseMcpPayload(text);
  if (payload.error) throw new Error(payload.error.message || "SellerSprite MCP returned an error");
  return payload.result ?? payload;
}

function parseMcpPayload(text) {
  const candidates = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== "[DONE]");
  const raw = candidates.at(-1) || text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    throw new Error("SellerSprite MCP 返回了无法解析的响应。");
  }
}

async function callSellerSpriteReviewApi(args) {
  const { returnFields, ...apiArgs } = args;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetchWithRetry(`${sellerSpriteApiUrl}/v1/review`, {
      method: "POST",
      headers: sellerSpriteHeaders(),
      signal: controller.signal,
      body: JSON.stringify(apiArgs)
    });
  } finally {
    clearTimeout(timeout);
  }
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`SellerSprite API 返回了无法解析的响应：${text.slice(0, 180)}`);
  }
  if (!response.ok || (payload.code && payload.code !== "OK")) {
    throw new Error(payload.message || payload.msg || `SellerSprite API HTTP ${response.status}`);
  }
  return payload.data ?? payload;
}

function extractReviews(result) {
  if (result?.structuredContent) return extractReviews(result.structuredContent);
  if (result?.result) return extractReviews(result.result);
  if (result?.list) return extractReviews(result.list);
  if (result?.rows) return extractReviews(result.rows);
  if (result?.records) return extractReviews(result.records);
  if (Array.isArray(result)) return cleanReviews(result);
  if (Array.isArray(result?.data)) return cleanReviews(result.data);
  if (Array.isArray(result?.data?.items)) return cleanReviews(result.data.items);
  if (Array.isArray(result?.items)) return cleanReviews(result.items);
  if (Array.isArray(result?.reviews)) return cleanReviews(result.reviews);

  const textBlock = result?.content?.find?.((item) => item.type === "text")?.text;
  if (textBlock) {
    try {
      const parsed = parseMcpPayload(textBlock);
      return extractReviews(parsed);
    } catch {
      return cleanReviews([{ title: "MCP 返回文本", content: textBlock, star: null }]);
    }
  }

  return [];
}

function cleanReviews(reviews) {
  return reviews
    .map((review) => {
      const content = stripHtml(review.content || review.reviewContent || review.text || review.body || "");
      return {
        ...review,
        author: review.author ?? review["[author"] ?? review.userName ?? review.reviewer ?? null,
        vine: review.vine ?? review["vine]"] ?? false,
        verified: Boolean(review.verified ?? review.vp ?? review.verifiedPurchase),
        image: Boolean(review.image ?? review.hasImage),
        video: Boolean(review.video ?? review.hasVideo),
        title: stripHtml(review.title || review.reviewTitle || ""),
        content,
        star: Number(review.star ?? review.rating ?? review.score) || null,
        date: review.date ?? review.reviewDate ?? null,
        images: Array.isArray(review.images) ? review.images : [],
        videos: Array.isArray(review.videos) ? review.videos : []
      };
    })
    .filter((review) => review.content);
}

function stripHtml(value) {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function handleReview(req, res) {
  if (!sellerSpriteSecret) {
    sendJson(res, 503, {
      ok: false,
      code: "MISSING_SECRET",
      message: "未配置 SELLERSPRITE_SECRET_KEY，真实评论拉取不可用。请先在 .env.local 或启动命令中配置卖家精灵密钥。"
    });
    return;
  }

  const args = cleanReviewArgs(await readJson(req));
  if (!args.asin) {
    sendJson(res, 400, { ok: false, code: "MISSING_ASIN", message: "请先输入 ASIN。" });
    return;
  }

  const primary = preferSellerSpriteMcp ? "mcp" : "api";
  const secondary = preferSellerSpriteMcp ? "api" : "mcp";

  try {
    const result = await callReviewSource(primary, args);
    sendReviewSuccess(res, primary, args, result);
  } catch (primaryError) {
    try {
      const result = await callReviewSource(secondary, args);
      sendReviewSuccess(res, secondary, args, result, primaryError);
    } catch (secondaryError) {
      sendJson(res, 502, {
        ok: false,
        code: "SELLERSPRITE_FAILED",
        message: primaryError.message,
        fallbackWarning: secondaryError.message
      });
    }
  }
}

async function callReviewSource(source, args) {
  return source === "mcp" ? callSellerSpriteMcp("review", args) : callSellerSpriteReviewApi(args);
}

function sendReviewSuccess(res, source, args, result, warning = null) {
  const reviews = extractReviews(result);
  const sourceName = source === "mcp" ? "sellersprite-mcp" : "sellersprite-api";
  if (!reviews.length) {
    sendJson(res, 404, {
      ok: false,
      code: "NO_REVIEWS",
      message: "卖家精灵已响应，但当前筛选条件没有返回可用评论。请换 ASIN、站点或放宽星级筛选。",
      source: sourceName,
      args,
      raw: result
    });
    return;
  }
  sendJson(res, 200, {
    ok: true,
    source: sourceName,
    args,
    count: reviews.length,
    reviews,
    raw: result,
    ...(warning ? { fallbackFrom: warning.message } : {})
  });
}

async function handleGenericMcp(req, res) {
  if (!sellerSpriteSecret) {
    sendJson(res, 503, { ok: false, code: "MISSING_SECRET", message: "未配置 SELLERSPRITE_SECRET_KEY。" });
    return;
  }
  const body = await readJson(req);
  if (!body.name) {
    sendJson(res, 400, { ok: false, code: "MISSING_TOOL", message: "缺少 MCP 工具名 name。" });
    return;
  }
  try {
    const result = await callSellerSpriteMcp(body.name, body.arguments || {});
    sendJson(res, 200, { ok: true, source: "sellersprite-mcp", result });
  } catch (error) {
    sendJson(res, 502, { ok: false, code: "MCP_CALL_FAILED", message: error.message });
  }
}

const ANALYZE_SYSTEM_PROMPT = `你是跨境电商团队的"业务大脑"，职责是判断一个产品方向是否值得继续做，而不是替老板拍板。
你会收到：产品线索（来源/标题/热度）、以及评论证据（真实差评、用户诉求、搜索词、成本假设）。
请输出严格的 JSON（不要输出任何 JSON 以外的文字、不要 markdown 代码块），schema 如下：
{
  "score": 0-100 的整数，证据强度与机会质量综合分,
  "confidence": 0-100 的整数，证据强度百分比,
  "decision": "继续" | "暂缓" | "放弃" | "小样验证" 四选一,
  "title": "机会标题，格式：'某卖点产品方向：结论短语'，25 字以内",
  "insight": "核心洞察，80 字以内：国内内容在卖什么 vs 海外用户真正付费的是什么",
  "actions": [ { "type": "产品" | "利润" | "验证" | "内容" | "供应链", "text": "具体可执行动作，40 字以内" } ] 恰好 3 条,
  "risks": [ "业务大脑提醒，30 字以内，指出老板最容易踩的坑" ] 恰好 3 条
}
要求：结论必须与证据一致，不得虚构数据；证据不足时宁可给"小样验证"或"暂缓"，不要盲目乐观。`;

async function callAnalyzeLlm(messages) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetchWithRetry(analyzeApiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${analyzeApiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: analyzeModel,
          messages,
          temperature: 0.3,
          max_tokens: 4000
        })
      });
      const text = await response.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        lastError = new Error(`分析模型返回了无法解析的响应：${text.slice(0, 180)}`);
        continue;
      }
      if (!response.ok) {
        lastError = new Error(payload.error?.message || payload.message || `分析模型 HTTP ${response.status}`);
        continue;
      }
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        lastError = new Error(`分析模型没有返回正文（finish_reason=${payload.choices?.[0]?.finish_reason || "unknown"}），已重试。`);
        continue;
      }
      return extractJson(content);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const raw = (fenced || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("分析模型输出中找不到 JSON。");
  const parsed = JSON.parse(raw.slice(start, end + 1));
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
  const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || score)));
  const decisions = ["继续", "暂缓", "放弃", "小样验证"];
  const decision = decisions.includes(parsed.decision) ? parsed.decision : "小样验证";
  const actions = (Array.isArray(parsed.actions) ? parsed.actions : [])
    .map((action) => ({ type: String(action.type || "验证"), text: String(action.text || "") }))
    .filter((action) => action.text)
    .slice(0, 4);
  const risks = (Array.isArray(parsed.risks) ? parsed.risks : []).map(String).filter(Boolean).slice(0, 4);
  if (!parsed.title || !parsed.insight || !actions.length) throw new Error("分析模型输出字段不完整。");
  return { score, confidence, decision, title: String(parsed.title), insight: String(parsed.insight), actions, risks };
}

async function handleAnalyze(req, res) {
  if (!analyzeApiKey) {
    sendJson(res, 503, {
      ok: false,
      code: "MISSING_ANALYZE_KEY",
      message: "未配置 ANALYZE_API_KEY，AI 实时分析不可用，前端将使用演示模式。"
    });
    return;
  }
  const body = await readJson(req);
  const evidence = String(body.evidence || "").trim();
  if (evidence.length < 10) {
    sendJson(res, 400, { ok: false, code: "EMPTY_EVIDENCE", message: "请先填写评论证据，再生成机会卡。" });
    return;
  }
  const context = body.context && typeof body.context === "object" ? body.context : {};
  const userPrompt = [
    `产品线索：来源=${context.source || "未知"}；标题=${context.title || "未命名"}；热度/元信息=${context.meta || "无"}。`,
    context.asin ? `Amazon ASIN：${context.asin}（站点 ${context.marketplace || "US"}）。` : "",
    `评论证据：\n${evidence.slice(0, 4000)}`,
    body.retryNote ? `老板退回了上一版结论：${body.retryNote}。请调整权重后重新输出。` : ""
  ].filter(Boolean).join("\n\n");

  try {
    const analysis = await callAnalyzeLlm([
      { role: "system", content: ANALYZE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]);
    sendJson(res, 200, { ok: true, model: analyzeModel, analysis });
  } catch (error) {
    const cause = error.cause?.code || error.cause?.message || error.cause;
    sendJson(res, 502, { ok: false, code: "ANALYZE_FAILED", message: error.message, ...(cause ? { cause: String(cause) } : {}) });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const resolved = path.normalize(path.join(__dirname, requested));

  if (!resolved.startsWith(__dirname) || !existsSync(resolved)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(resolved);
  const content = await readFile(resolved);
  res.writeHead(200, { "content-type": staticTypes[ext] || "application/octet-stream" });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        sellerSpriteConfigured: Boolean(sellerSpriteSecret),
        sellerSpriteMode: preferSellerSpriteMcp ? "mcp" : "api",
        mcpUrl: sellerSpriteMcpUrl.replace(/\?.*$/, ""),
        analyzeConfigured: Boolean(analyzeApiKey),
        analyzeModel
      });
      return;
    }
    if (req.method === "POST" && req.url === "/api/analyze") {
      await handleAnalyze(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/sellersprite/review") {
      await handleReview(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/sellersprite/mcp-call") {
      await handleGenericMcp(req, res);
      return;
    }
    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI 选品机会卡决策站已启动: http://localhost:${port}`);
  console.log(`SellerSprite MCP: ${sellerSpriteSecret ? "已配置密钥" : "未配置密钥，前端将保留演示模式"}`);
  console.log(`AI 分析模型: ${analyzeApiKey ? `${analyzeModel} 已配置` : "未配置 ANALYZE_API_KEY，机会卡将使用演示模式"}`);
});
