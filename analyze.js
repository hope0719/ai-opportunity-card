#!/usr/bin/env node
// 选品机会卡命令行工具（零依赖、零密钥）
//
// 用法：
//   node analyze.js --evidence "差评文本..." [选项]
//   echo "差评文本" | node analyze.js --stdin
//
// 选项：
//   --evidence, -e  评论/差评证据文本（必填，或用 --stdin）
//   --title,   -t   产品标题（如：旅行数码收纳包）
//   --source,  -s   线索来源（如：小红书爆款）
//   --meta,    -m   热度/元信息（如：2.8w 收藏 · 1688 可追溯）
//   --retry,   -r   老板退回反馈，触发重算模式
//   --json         输出原始 JSON（默认输出可读卡片）
//   --stdin        从标准输入读证据文本
//   --help,   -h   显示帮助

import { generateLocalAnalysis, formatCard } from "./local-engine.js";

function parseArgs(argv) {
  const args = { _: [] };
  const map = {
    "--evidence": "evidence", "-e": "evidence",
    "--title": "title", "-t": "title",
    "--source": "source", "-s": "source",
    "--meta": "meta", "-m": "meta",
    "--retry": "retry", "-r": "retry",
    "--json": "json", "--stdin": "stdin",
    "--help": "help", "-h": "help"
  };
  for (let i = 0; i < argv.length; i++) {
    const key = map[argv[i]];
    if (key === "json" || key === "stdin" || key === "help") { args[key] = true; continue; }
    if (key) { args[key] = argv[i + 1] ?? ""; i++; continue; }
    if (!argv[i].startsWith("-")) args._.push(argv[i]);
  }
  // 支持把差评文本作为位置参数直接传入
  if (!args.evidence && args._.length) args.evidence = args._.join(" ");
  return args;
}

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => resolve(raw.trim()));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`选品机会卡命令行工具（零依赖、零密钥）

用法:
  node analyze.js --evidence "差评文本..." [选项]
  echo "差评文本" | node analyze.js --stdin

选项:
  --evidence, -e   评论/差评证据文本（必填，或用 --stdin，也可直接作为位置参数）
  --title,   -t    产品标题（如：旅行数码收纳包）
  --source,  -s    线索来源（如：小红书爆款）
  --meta,    -m    热度/元信息（如：2.8w 收藏 · 1688 可追溯）
  --retry,   -r    老板退回反馈，触发重算模式（降低乐观权重）
  --json           输出原始 JSON（默认输出可读卡片）
  --stdin          从标准输入读证据文本`);
    process.exit(0);
  }

  let evidence = args.evidence || "";
  if (!evidence && args.stdin) evidence = await readStdin();

  if (!evidence || evidence.length < 10) {
    console.error("错误：证据文本太短。用法示例：");
    console.error('  node analyze.js --evidence "拉链用了两次就卡住了，容量也没有视频里说的那么大。"');
    console.error("  node analyze.js --help 查看全部选项");
    process.exit(1);
  }

  const context = {
    source: args.source || "",
    title: args.title || "",
    meta: args.meta || ""
  };
  const analysis = generateLocalAnalysis(evidence, context, args.retry || "");

  if (args.json) {
    console.log(JSON.stringify({ engine: "local-engine", analysis }, null, 2));
  } else {
    console.log(formatCard(analysis, context));
  }
}

main();
