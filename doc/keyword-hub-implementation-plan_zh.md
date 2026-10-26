# 长尾 Hub 实施计划（Phase B）— 5 个站点主关键词

> 前提：5 个站点主词（balance bike、electric car for kids、double stroller、jogger stroller、travel stroller）的 head-term Google KD 普遍 50–70，直接硬刚需 100+ 引用域名，ROI 极差。
> 路线（已与用户确认）：**长尾 hub** —— 每个主词当 hub，用 KD 30–49、搜索量 ≥100/月 的 "best X for Y / X for [年龄/场景]" 指南页承接，转化更高且可赢，复用现有 guides 集群模型。
> 本计划基于已评估的难度画像（非精确 Ahrefs 数据，精确值见 `keyword-difficulty-checklist_zh.md`），上线后应以真实数据回填校正。

---

## 一、优先级（估算 KD × 搜索量）

| 顺位 | 主词 | 为何排这 | 现有资产 | 长尾打法 |
|---|---|---|---|---|
| 1 | **travel stroller** | 需求最大、长尾最长（飞机/ toddler/ 超轻/2026） | 仅塌缩在 `/products/strollers/` | 优先建长尾指南 |
| 2 | **electric car for kids** | 需求最大 + 已有 kids-ride-on 集群；先修意图 | `/products/electric-cars/` + 8 页 ride-on | 补 "best electric car for kids 2026" 等 |
| 3 | **balance bike** | 已有 7 页基础，只补年龄/场景长尾 | 7 指南 + `/products/balance-bikes/` | 年龄/场景长尾 |
| 4 | **double stroller** | 并入 strollers hub，主攻实测 KD34 的 "best double stroller for travel" | 塌缩在 `/products/strollers/` | 长尾 + 并入 hub |
| 5 | **jogger stroller** | 并入 strollers hub，Amazon 端品牌极集中，预期最慢 | 塌缩在 `/products/strollers/` | 长尾 + 并入 hub |

---

## 二、长尾页清单（按主词，标注优先级与估算 KD 带）

### travel stroller（最高优先）
- `best travel stroller 2026` — 核心 hub 页
- `travel stroller for airplane` — 高转化场景
- `travel stroller for toddler` — 年龄
- `lightweight travel stroller`
- `compact travel stroller`
- `best travel stroller for airplane 2026`
- `travel stroller with car seat`
- `umbrella travel stroller`
- `travel stroller for newborn`
- `foldable travel stroller`
- `travel stroller for cruise`
- `travel stroller for 2 year old`
- `best travel stroller for 3 year old`

### electric car for kids
- `best electric car for kids 2026` — 核心 hub 页
- `12v kids electric car` — 规格长尾
- `24v ride on car`
- `electric ride on car with remote control`
- `kids electric car with parental control`
- `2 seater ride on car`
- `ride on car for 2-5 year olds`
- `cheap kids electric car`
- `kids electric car 12v with remote`
- `toddler electric car`

### balance bike（在现有 7 页上加）
- `balance bike for 1 year old`
- `balance bike for 2 year old`
- `balance bike for 3 year old`
- `best balance bike 2026`
- `balance bike with brakes`
- `wooden balance bike`
- `balance bike vs training wheels`
- `12 inch balance bike`
- `lightweight balance bike`
- `balance bike age range`
- `balance bike helmet`

### double stroller（并入 strollers hub）
- `best double stroller 2026`
- **`best double stroller for travel`（KD34，实测可赢，最高优先）**
- `double stroller for twins`
- `side by side double stroller`
- `double stroller for infant and toddler`
- `lightweight double stroller`
- `double jogging stroller`
- `compact double stroller`
- `double stroller for newborn and toddler`
- `tandem double stroller`
- `graco double stroller`

### jogger stroller（并入 strollers hub，预期最慢）
- `best jogging stroller 2026`
- `jogging stroller for trails`
- `double jogging stroller`（与 double 共享）
- `jogging stroller for baby`
- `lightweight jogging stroller`
- `jogging stroller with car seat`
- `bob jogging stroller`
- `jogging stroller for newborns`
- `best jogging stroller for runners`
- `affordable jogging stroller`
- `jogging stroller vs regular stroller`

---

## 三、slug / URL 架构决策

- **balance bike / electric car**：已有独立 hub（`/products/balance-bikes/`、`/products/electric-cars/`）+ guides 集群，长尾指南走现有 `/guides/<topic>/<slug>` 体系，不新建品类目录。
- **stroller 三变体（jogger / double / travel）**：**暂不建独立 slug**。理由：每页内容薄会被判低质反而拖累；三者共享 `/products/strollers/` 的权威更稳。GSC 观测缺陷（三者混在同一 URL 下无法区分）用以下方式缓解：
  - 长尾指南 title/H1 精确写原词（double/travel/jogger），用原词锚文本内链到 `/products/strollers/` 与对应产品页；
  - 若某变体长尾量（真实数据）足够大、且单页能养厚，再评估升级为独立 slug（`/products/double-strollers/` 等）。
- **红线**：裸 `electric car` 不碰（Tesla 霸占，KD80+）；全站统一 `double` 弃 `twin`。

---

## 四、内部链接与集群修正

- 长尾指南用**原词**做锚文本内链到对应 `/products/` 商业页与产品详情页，把权威度传过去。
- 复用已发布的 `referenceCluster` 48 卡（CMS `settings.referenceCluster`）做相关推荐块。
- 产品页 CTA 维持站内指南（Amazon 联盟刻意休眠，不动）。
- **全站统一 double 弃 twin**：代码层已修正（`seoKeywordMap.ts` 的 `all`/`strollers`/`double_strollers`/`jogger_stroller` + `pageKeywords.ts` 的 `CATEGORY_TDK_MAP.stroller`，twin→double、kids electric bike→electric car for kids）；**CMS 实时层**（`seo.home`/`seo.products`）仍缺 double/travel stroller，需另同步（见里程碑 M1）。

---

## 五、构建顺序（里程碑）

- **M1（可选快速 win）**：CMS `seo.home` / `seo.products` 同步加入 `double stroller` + `travel stroller`（en）与 `双人婴儿推车` + `旅行婴儿推车`（zh）。纯加法、在 KD 上限内、零风险，让站点级页面直接反映 5 主词。
- **M2**：travel stroller 长尾指南（最高优先，先做 4–6 篇核心：airplane / toddler / lightweight / 2026 / with car seat / cruise）。
- **M3**：electric car for kids 长尾指南（best 2026 / 12v / 24v / remote control / 2 seater）。
- **M4**：balance bike 年龄/场景长尾（for 1/2/3 year old / with brakes / wooden / vs training wheels）。
- **M5**：double / jogger 长尾并入 strollers hub（主攻 KD34 的 best double stroller for travel）。
- **M6**：每批发布后重跑 `check:spakeywords` / `check:zh-english`；sitemap + GSC 索引 + Performance/Queries 盯 5 词 Impressions / Avg Position（4–6 周才稳定出排名）。

---

## 六、验证闭环

- 每批指南发布后跑守卫：`npm run check:spakeywords`、`npm run check:zh-english`。
- GSC Performance → Queries，筛选/正则盯 5 主词，看 Impressions、Clicks、Avg Position。
- 数据滞后 2–3 天；新页 4–6 周稳定出曝光，别用周数据下结论；用 Compare 两段 28 天看趋势。
- 判据：5 词 Impressions 从 0→有数、Avg Position 从 >50 爬进前 20，即策略生效。

---

## 七、下一步

M1 是可选快速 win（需一次 CMS 写操作，涉及线上，需你确认后再执行）。M2–M5 是长尾指南内容生产，走现有 guides 7 层接线（data 文件 + 组件 + App.tsx + prerender + pageKeywords + referenceCluster + 4 个硬编码守卫清单）。确认后我从 M2 的 travel stroller 第一批开始建。
