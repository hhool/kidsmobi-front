# balancebiketoddler.com — SEO / GEO 周度运维脚本

本目录（`scripts/seo/`）是站点级 SEO 运维脚本集合，配合 WorkBuddy 的周期任务（automation）每周自动运行。全部脚本针对**线上生产站** `https://balancebiketoddler.com` 运行（用 Node 内置 `fetch`），不依赖构建产物。

## 文件

| 脚本 | 用途 | 对应周期任务 |
| --- | --- | --- |
| `config.mjs` | 共享配置（站点基址、IndexNow key、query 聚类、基线） | — |
| `indexnow-submit.mjs` | 抓取线上 sitemap，增量提交新/改 URL 到 IndexNow（Bing/Yandex/Seznam/Hub） | IndexNow 索引提交 |
| `site-health-check.mjs` | 站点体检：robots / sitemap 新鲜度 / 关键页 meta 完整度 / llms.txt / 内链抽样 | 站点周度体检 |
| `keyword-opportunity-scan.mjs` | 热词机会扫描：抓取全站 meta，对照 query 聚类找内容缺口 + 弱页 | 周度热词机会扫描 |
| `geo-ops.mjs` | GEO 运维：llms.txt / robots AI 爬虫策略 / JSON-LD / 事实型内容块 | SEO GEO 周度运维 |

## 运行

```bash
cd front
node scripts/seo/indexnow-submit.mjs            # 增量提交（默认）
node scripts/seo/indexnow-submit.mjs --full     # 提交全部
node scripts/seo/indexnow-submit.mjs --dry-run  # 只解析不 POST
node scripts/seo/site-health-check.mjs          # 站点体检
node scripts/seo/keyword-opportunity-scan.mjs   # 热词扫描
node scripts/seo/geo-ops.mjs                    # GEO 运维
```

`package.json` 里也加了快捷命令：`seo:indexnow` / `seo:health` / `seo:keywords` / `seo:geo` / `seo:weekly`。

环境变量：`SEO_SITE_BASE_URL`（默认 `https://balancebiketoddler.com`）、`INDEXNOW_KEY`。

## IndexNow 配置说明

- Key：`dfb12ac97ad4a34c75ccf6cc4b783c7f`（生成于 2026-10-15）。
- 校验文件已放到 `public/dfb12ac97ad4a34c75ccf6cc4b783c7f.txt`，**随下次部署上线**后，`https://balancebiketoddler.com/dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` 需可公开访问，IndexNow 提交才会被接受。
- IndexNow key 本就设计为公开（校验文件公开托管），提交进仓库是标准做法，无泄露风险。

## 周期任务调度

三个 weekly automation（周一 GEO / 周三 IndexNow / 周五 体检+热词）。如需改时间或合并，告诉我即可。

## 注意

- 这些脚本需要**出站网络**（访问线上站 + IndexNow API）。若运行环境沙箱拦截网络，请放开网络后重试。
- `keyword-opportunity-scan` 是内容缺口 + 卫生扫描，**不是**排名追踪器；真实需求数据请结合 Google Search Console。
- IndexNow 提交用 `.last-indexnow.json` 快照做增量；首次或 `--full` 会提交全部 URL。
