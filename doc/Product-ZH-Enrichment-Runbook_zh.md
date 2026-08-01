# 产品中文数据 Enrichment 操作说明

这套流程分成两部分：自动脚本负责生成中文产品数据和审核报告，人工负责看报告、调词表、确认例外项，再决定是否回灌到生产 D1。脚本本身不直接改前端组件。

## 自动部分

自动部分只做三件事：读取 CMS export、生成中文增强版 JSON、生成审查报告。

### 1. 生成小批次样本

```bash
npm run cms:enrich:zh -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/products.zh.sample.json \
  --report=tmp/products.zh.sample.report.json \
  --limit=10
```

这个命令用于快速看效果，确认标题清洗、类目判断、功能词提取和中文字段填充是否符合预期。默认只替换缺失、英文镜像或占位中文，保留已有人工中文；只有明确需要覆盖人工中文时才使用 `--force`。

### 2. 生成完整审核批次

```bash
npm run cms:enrich:zh -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/products.zh.review.json \
  --report=tmp/products.zh.review.report.json
```

完整批次用于人工审核。它会输出产品级别的 before/after、taxonomy、source、featureSignals、features、zh 文案等结果，方便直接判断哪些内容可以入库。

### 3. 生成最终可回灌版本

```bash
npm run cms:enrich:zh -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/products.zh.final.json \
  --report=tmp/products.zh.final.report.json
```

最终版本应当只在审核通过后再进入生产回灌。当前脚本已经支持：

- `taxonomy`：category/subcategory 以及显示名；
- `source`：rawTitle、cleanedTitle、titleVersion 等来源信息；
- `featureSignals`：标题提取的功能信号；
- `features`：适合展示的中文功能点；
- `other`：无法准确归类的兜底项，且标记为 `systemUse:false`。

## 手动部分

人工部分不做重复劳动，只做审核和决策。

### 1. 看报告

重点检查这些内容：

- `blocked` 是否为 0；
- `unknownSubcategory` 是否已经收敛；
- `placeholderResidue` 是否还有模板残留；
- `mixedLanguageNoise` 是否接受；
- `duplicateCopy` 是否存在大面积重复文案；
- `otherCount` 是否符合预期。

品牌、系列、型号、ASIN、认证标识、电压和尺寸单位可以保留英文或原始格式，不必强行翻成中文。

### 2. 抽样核对

优先抽看三类样本：

- 类目明显、功能词丰富的条目，确认中文化是否自然；
- `unknown_*` 或 `other` 条目，确认是否应该补规则还是保留兜底；
- 详情页和卡片摘要，确认没有把英文原文、占位语或无意义重复串进展示层。

### 3. 调整词表或规则

词表位于 `scripts/config/product_zh_glossary.v1.json`。如果类目名、规格词、功能词、别名映射不准，先改词表，再重新生成 review 批次复核。

词表版本变更时要同步更新 `version`，避免后续审核无法判断当前数据是基于哪一版规则生成的。

### 4. 决定是否 force

只有在明确要覆盖已有人工中文时才使用 `--force`。默认策略应该是尽量保留人工中文，只补齐缺失和明显英文镜像。

## 回灌部分

人工审核通过后，才允许进入 safe replace。

先跑预检，不加 `--apply`：

```bash
npm run cms:replace:safe -- \
  --base=https://store.balancebiketoddler.com \
  --input=tmp/products.zh.final.json \
  --mode=replace \
  --collections=products
```

确认预检没有问题后，再执行真正写入：

```bash
npm run cms:replace:safe -- \
  --base=https://store.balancebiketoddler.com \
  --input=tmp/products.zh.final.json \
  --mode=replace \
  --collections=products \
  --allow-empty=all \
  --apply
```

回灌完成后，建议做一次最小烟雾检查：刷新线上中文页面，抽查首页、产品列表和详情页是否已经读取到新中文字段。

## 建议执行顺序

1. 先跑 sample。
2. 再跑 review。
3. 必要时调整词表。
4. 生成 final。
5. 先预检，再 `--apply`。
6. 最后做线上 smoke check。

## 标题拆词词库（用于后续正文转换）

当你需要把所有产品标题里的英文词和词组拆分并映射到中文，用于后续其它正文自动转换时，执行：

```bash
npm run cms:lexicon:title -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/title_phrase_lexicon.json \
  --report=tmp/title_phrase_lexicon.report.json \
  --ts-output=src/lib/titlePhraseLexicon.ts \
  --min-count=2 \
  --max-ngram=4 \
  --top=600
```

产物说明：

- `tmp/title_phrase_lexicon.json`：完整候选词与词组、频次、示例、映射状态；
- `tmp/title_phrase_lexicon.report.json`：覆盖率和高频词摘要；
- `src/lib/titlePhraseLexicon.ts`：可直接被前端/脚本复用的 TS 词库（英文为基准 key）。

维护建议：

- 先补高频 `pending` 条目，再重跑脚本；
- 词组优先于单词，先保证语义完整（如 `training wheels` 优先于 `training` + `wheels`）；
- 所有新增映射尽量保持“英文原词组 -> 中文自然短语”，便于后续正文自动替换与校对。

## 高频待翻译清单导出（持续补词）

在完成词库生成后，导出高频待翻译词组，优先补 `pending`：

```bash
npm run cms:lexicon:title:pending -- \
  --input=tmp/title_phrase_lexicon.json \
  --output=tmp/title_phrase_pending.top200.json \
  --markdown=tmp/title_phrase_pending.top200.md \
  --top=200 \
  --min-count=2
```

产物：

- `tmp/title_phrase_pending.top200.json`：结构化待翻译清单；
- `tmp/title_phrase_pending.top200.md`：便于人工审阅和批注的表格版。

## 正文转换（v3 推荐流程）

对 `cardSummary`、`description`、`editorVerdict` 执行词组优先替换，单词回退，输出 before/after 报告：

```bash
npm run cms:text:convert:lexicon -- \
  --input=tmp/zh-final.json \
  --lexicon=src/lib/titlePhraseLexicon.ts \
  --output=tmp/zh-final.lexicon-converted.v3.json \
  --report=tmp/zh-final.lexicon-converted.v3.report.json \
  --min-confidence=0.8 \
  --min-count=3
```

说明：

- v3 策略已内置前导身份段保护（品牌/型号前缀），避免过度替换；
- 报告用于定位替换命中与潜在噪音，优先人工抽检 `rows` 前 50 条。

## 生产回灌（lexicon 转换版）

先预检：

```bash
npm run cms:replace:safe -- \
  --base=https://store.balancebiketoddler.com \
  --input=tmp/zh-final.lexicon-converted.v3.json \
  --mode=replace \
  --collections=products
```

预检通过后再 apply：

```bash
npm run cms:replace:safe -- \
  --base=https://store.balancebiketoddler.com \
  --input=tmp/zh-final.lexicon-converted.v3.json \
  --mode=replace \
  --collections=products \
  --allow-empty=all \
  --apply
```

最后执行线上 smoke check：

- 首页随机 3 个产品卡片；
- 产品列表页随机 3 个详情页；
- 对照 `tmp/zh-final.lexicon-converted.v3.report.json` 抽查命中字段是否自然。
