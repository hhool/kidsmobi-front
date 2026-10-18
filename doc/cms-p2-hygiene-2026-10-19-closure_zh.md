# CMS P2 数据卫生关闭核查 — 2026-10-19

> 关联：`doc/cms-data-audit-2026-10-16_zh.md`（2026-10-16 全量审核，任务 #52 的三个 P2 子项来源）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（并行收录分析）。
> 性质：只读取证 + 文档，未改动任何站点代码或 CMS 数据。
> 运行时间：2026-10-19 00:45-00:55（GMT+8）。

## 0. 结论速览

| 子项（10-16 审计记录） | 复验结果 | 处置 |
|---|---|---|
| top-level `category` vs `taxonomy.categoryId` 矛盾 ×117 | 实测 119/213（口径见 §2）；**消费点为零** | 关闭（惰性字段，无需修） |
| `scenarioIds` 缺 `scenario-` 前缀 ×6 | 线上现存 scenarioIds **总量 0** | 关闭 |
| Graco 厂商文案无来源标注 | #49 已改第一人称 "We tested"→"Graco tested its"；剩余 ProtectPlus 文案以制造商为主语；全库第一人称测试宣称扫描 **0 命中** | 关闭 |

## 1. 方法

- 线上公开 API 全量拉取（`GET /api/cms/products`，带新 buster + 重试）：**213 条**。
- 源码级消费点核查：`front/src/` 与 `backend/api/worker/src/` 全局检索 `taxonomy`——产品级 `taxonomy.categoryId` **无任何读取方**（guide 的 taxonomy 是另一套字段，与本项无关）。
- 宣称扫描：13 条英文 + 5 条中文第一人称/无归属测试宣称模式，逐产品 × 15 个文本字段（name/description/cardSummary/editorVerdict/customersSay/features/pros/cons + zh 对应）。

## 2. 逐项证据

### 2.1 category 矛盾（119 条，惰性）

- 原始 `category`（如 `safety_seat`、`bicycle`）与 `taxonomy.categoryId`（如 `car_seat`、`kids_bikes`）不一致的共 **119/213**（审计记 ×117，口径差异来自抽样时点与规范化方式，量级一致）。
- 但前端品类解析 `resolveProductCategoryId`（`src/lib/productCategoryPaths.ts`）取 **`categoryId || category`**：全部 213 条都有 `categoryId`，原始 `category` 永不参与解析。
- 且 `categoryId` 与 `taxonomy.categoryId` **213/213 完全一致**（0 矛盾）。
- 结论：矛盾仅存在于两个派生/备用表示之间，**零渲染影响**（sitemap、hub、详情路径、301 目标全部由 `categoryId` 驱动）。清洗 119 条需 119 次 CMS 写操作，零收益，不执行。

### 2.2 scenarioIds 前缀（现存 0 条）

- 线上 213 条产品的 `scenarioIds` 数组**全为空**（审计时的 ×6 已被后续写入清空或从未落库）；且该字段公开渲染路径从不消费。
- 结论：无可修对象，关闭。

### 2.3 Graco 厂商文案

- 9 条 Graco 产品逐条扫描：第一人称 "We tested" 已在 #49（2026-10-16）改为 "Graco tested its"（归属制造商），zh 对应句"葛莱对这款……进行了全套配置测试"同样以葛莱为主语。
- 剩余 "Graco ProtectPlus Engineered to the newest testing standards for side impact" 是**以制造商为主语的工程设计宣称**（非测试结果宣称），与 #49 中带 "(manufacturer-listed)" 的认证宣称同类处理已足够。
- 全库扫描（213 条 × 15 字段）：第一人称/无归属测试宣称 **0 命中**。
- 结论：无需再改，关闭。

## 3. 顺手核实关闭的两个陈旧任务

- **#48（写接口认证）**：本会话多次线上探针证实闸门生效——无 token POST `/api/cms/settings/save` → **403 AdminTokenRequired**，公开 GET 读 200。front `f5fc164` + Worker `e02e62d` 均已部署。
- **#51（头盔品类结构）**：与 #58 同一决策——站点不显示头盔品类；`ProductsSection.isHelmetProduct` 三处排除调用点（L1563/1617/1700）仍在。

## 4. 留档

- 复验脚本：`front/tmp/cms-p2-reverify.mjs`、`front/tmp/claim-sweep.mjs`、`front/tmp/graco-scan.mjs`（tmp/ 已 gitignore，仅本地）。
- 复验报告：`front/tmp/cms-p2-reverify-2026-10-19.json`。
