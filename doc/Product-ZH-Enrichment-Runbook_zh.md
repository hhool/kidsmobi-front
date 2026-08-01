# 产品中文数据 Enrichment 操作说明

该流程只生成本地 CMS export 和审核报告，不直接写入 D1，也不修改前端组件。

## 1. 生成小批次样本

```bash
npm run cms:enrich:zh -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/products.zh.sample.json \
  --report=tmp/products.zh.sample.report.json \
  --limit=10
```

默认仅替换缺失、英文镜像或占位中文，保留已有人工中文。只有明确需要覆盖人工中文时才使用 `--force`。

## 2. 生成完整审核批次

```bash
npm run cms:enrich:zh -- \
  --input=../env/cms-export-1785532022314.json \
  --output=tmp/products.zh.review.json \
  --report=tmp/products.zh.review.report.json
```

审核报告包含：

- 9 个目标字段的填充率；
- 逐产品、逐字段 before/after；
- 品牌和源字段保护阻断；
- 占位文本残留；
- 混合语言候选；
- 卡片摘要、详情描述和编辑结论的重复文案组。

审核时应优先处理 `blocked`、`placeholderResidue` 和 `mixedLanguageNoise`。品牌、系列、型号、ASIN、认证标识、电压与尺寸单位可以保留英文或原始格式。

## 3. 调整规则并重生成

词表位于 `scripts/config/product_zh_glossary.v1.json`。调整类别名、规格词或功能词后，重新生成完整批次并复核报告。词表版本变更时同步更新 `version`。

## 4. 批准后导入

只有人工审核通过的 export 才能进入 safe replace。先运行不带 `--apply` 的预检：

```bash
npm run cms:replace:safe -- \
  --base=https://store.balancebiketoddler.com \
  --input=tmp/products.zh.review.json \
  --mode=replace \
  --collections=products
```

确认预检结果后，才可在同一命令末尾添加 `--apply`。本 enrichment 脚本不会自动执行该步骤。
