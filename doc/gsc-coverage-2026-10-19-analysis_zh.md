# GSC Coverage 导出分析（2026-10-19）

**数据源**：用户导出的 GSC Page indexing（Coverage）报告 `balancebiketoddler.com-Coverage-2026-10-19.zip`（Chart.csv / Critical issues.csv / Metadata.csv / Non-critical issues.csv）。
**核心事实：本导出与 10-18 导出逐字节一致**（四个 CSV 全部 md5 相同；两个 zip 均为 1095 字节）——**不含任何新数据，也无回归**。图表数据仍截止 **2026-10-12**。
**配套前情**：`doc/gsc-coverage-2026-10-18-analysis_zh.md`（10-18 完整分析，本文只做增量）。

---

## 0. TL;DR

| 问题 | 答案 |
|---|---|
| 导出有新信息吗 | **没有**。与 10-18 导出 md5 级一致（Chart / Critical issues / Non-critical / Metadata 四件全同）；GSC Coverage 数据窗口仍冻结在 10-12，对本属性滞后约 6-7 天 |
| 「Validation failed」转好了吗（用户 10-16 重点的 VALIDATE FIX） | **尚未**。redirect 组（4）仍 **Started**（非 Passed）；canonical 组（9）仍 **Failed**。但两组的关键修复都发生在本数据窗口之后（301 于 10-18 22:30 上线、canonical 根因 10-19 才修完），**看不到效果是正常的，不是回归** |
| 两新页收录了吗 | **仍未收录**。indexed 仍 14/271（09-22 起钉死），stability 页仍在 242 条「Discovered - currently not indexed」池里 → stable-track 迁移继续被机制性阻塞 |
| 要继续每天重新导出吗 | **不必**。窗口冻结在 10-12，下次导出若仍在 10-12 前后则仍是同一份数据；**约 10-22~24 再导**（届时图表应推进到 10-15~18，首次覆盖 10-15 IndexNow / 10-16 Request Indexing / 10-16 重验证 / 10-18 301 上线） |

## 1. 导出一致性验证（方法留档）

```bash
diff doc/gsc-coverage-2026-10-18-export/*.csv doc/gsc-coverage-2026-10-19-export/*.csv   # 零差异
md5sum  # Chart.csv a358b179…、Critical issues.csv d58020fa…，两天导出完全相同
```

- 两天 zip 均为 1095 字节；Chart.csv 末日均为 2026-10-12（indexed 14 / not indexed 257 / impressions 8）。
- Critical issues.csv 六行完全相同：canonical(9) Failed / noindex(1) Not Started / redirect(4) **Started** / Discovered(242) Started / Crawled(1) Started / Duplicate-without-canonical(0) **Passed**。
- Non-critical issues.csv 两天均为空表；Metadata.csv 均为 "All known pages"。
- Downloads 中无其他 GSC 导出（无 Performance 导出；stable-track 迁移判定仍缺 Performance 数据）。

## 2. 对四个开放问题的回答

**① redirect 组（4）重验证通过了吗？——没有，仍 Started。**
10-16 用户重点 VALIDATE FIX 后 Google 接受了验证启动（r3 已确认 Started）；三天后仍未转 Passed。合理解释：验证需要 Google 复抓并确认重定向链，而 301 的服务端支撑（23 条 retired listing → 幸存者）**10-18 22:30 才上线**（backend `7a4f4db` 部署，r5 记录），晚于本数据窗口。**无回归；预期下次数据推进后转 Passed。**

**② canonical 组（9）仍 Failed？——是，且无需再点 VALIDATE FIX。**
10-13 截图顶部「Validation failed（10/11→10/13）」对应的就是这一组（10-18 分析 §5 的解答）。根因（SPA 水合改写 canonical）今天（10-19）才修复上线（front `3f01510`），**晚于本数据窗口**；按既定口径：**不要再点 VALIDATE FIX**，等复抓自然消化，趋势递减中。

**③ 两新页收录了吗？——没有，仍在停车场。**
indexed 14/271 连续 26 天零净增长（09-22 sitemap 全量提交起）；10-05~10-09 曾有 14→13→14 的单页进出（10-18 分析 §3 已记录，良性）。两页 10-15 IndexNow + 10-16 Request Indexing 的效果在本窗口（截止 10-12）内**原理上不可能可见**。Bing 侧旁证（r10）：budget/stability 路径 site: 查询均拿到过格式良好 no-results（跨 4 边缘节点）。

**④ stable-track 迁移？——仍阻塞。**
stability 页自身未收录 → 不可能是 "stable track" 的承载页；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。仍缺 Performance 导出（Query contains "stable track" → PAGES 页签），GSC 2-3 天滞后下约 10-22~24 落地。

## 3. 本数据窗口（截止 10-12）之后发生的动作——均未反映

| 日期 | 动作 | 预期可见时间 |
|---|---|---|
| 10-15 | IndexNow 增量提交（含两新页） | ~10-22~24 |
| 10-16 | budget+stability Request Indexing；redirect 组重 VALIDATE FIX | ~10-22~24 |
| 10-18 22:30 | 23 条 retired listing 301 上线（backend `7a4f4db`） | ~10-24~26（需复抓） |
| 10-19 | SPA canonical 根因修复上线（front `3f01510`） | ~10-25~27 |
| 10-15/16 | sitemap 干净路径修复 + priority 修复（已稳定 ~104h，r10 连续验证） | 持续生效中 |

## 4. 建议（用户侧）

1. **10-22~24 再导一次 Coverage**（不必每天导——窗口冻结，导了也是同一份数据）。核对三项：① indexed 14 → 15/16 ② redirect Started → Passed ③ canonical 组数量下降。
2. **GSC URL Inspection 两新页**：仍是指令级权威判定（10-19~20 的数据才反映 10-16 提交）。
3. **导出 Performance**（Query contains "stable track" → PAGES）验证承载页迁移；放入 `doc/` 后自动化会分析。
4. **不要再对 canonical 组点 VALIDATE FIX**（根因已修，等复抓）；redirect 组若下次导出仍 Started 且 301 在线（已在线），可再点一次验证。
5. **外链建设仍是唯一实质杠杆**（26 天平台期 + 94% Discovered-not-indexed + 零外链的诊断链不变）；`doc/backlink-outreach-pack-2026-10-19_zh.md` 可直接启动。
6. （可选）Bing Webmaster Tools 移除两条前站长垃圾 URL（线上已 404/301 全量复核；Bing 索引第 10 天仍在）。

## 5. 运行留档

- 解压：`doc/gsc-coverage-2026-10-19-export/`（四 CSV）；与 10-18 导出 diff = 零差异，md5 一致。
- Downloads 复核：仅 Coverage zip ×2（10-18 21:03 / 10-19 16:36，均 1095 字节），无 Performance 导出。
- 站点侧本轮无新动作（r10 运行刚于 16:30 完成全绿核查：sitemap 247/247、两页 200 自指 canonical、seo:health 100/100）。
- 未改动任何站点代码。
