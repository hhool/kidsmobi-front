# GSC 手动操作清单（2026-10-21）

有三件事只能在 Search Console 里用资源所有者账号完成。其余（sitemap 生成、
IndexNow、重定向链修复、JSON-LD 去重）都已自动化。本文件是手动部分的操作清单。

资源：**balancebiketoddler.com**（建议用域名资源，可同时覆盖 http/https 与
非 www 形态）。

Google **不**参与 IndexNow，所以服务端推送的任何东西都不会自己进入 Google
索引。GSC 是唯一抓手。

---

## 1. 重新提交 sitemap

**为什么**：sitemap 自上次确认的 GSC 读取以来，URL 集合已多次变动（移除了
retired URL、新增了指南）。只要不重新提交，GSC 会一直沿用旧的「上次读取」
状态。

1. GSC → **Sitemaps**
2. 如果已有旧的 `sitemap.xml` 条目，先删掉——陈旧条目会继续报告旧的 URL 数
3. 添加新 sitemap：`sitemap.xml` → **提交**
4. 预期：状态变 **成功**，「已发现的网址」爬向 **269**

**提交前的 sanity check**（2026-10-21 已验证）：

```
curl -s https://balancebiketoddler.com/sitemap.xml | grep -o "<url>" | wc -l   # 269
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://balancebiketoddler.com/sitemap.xml
# 200 application/xml; charset=utf-8
```

sitemap 有双源且已对齐（无 buster 时 Worker 从 D1 构建，否则用 prerender 的
`dist/sitemap.xml`），两侧同为 269 条 URL。

## 2. 验证面包屑修复

**为什么**：JSON-LD 此前有三个发射源，重复节点导致 GSC 在抽样的 21 页里
报告了约 20 页的重复 Breadcrumb 行。修复已部署，但在点击验证前报告不会
自动消失。

1. GSC → **网页编入索引 / 网页呈现效果** → 找到面包屑相关条目
2. 打开，确认「示例网址」列表里已无重复
3. 点 **验证修复**
4. 周期通常几天到两周，完成后 GSC 会发邮件。

## 3. 请求编入索引（4 个新页面）

Google 配额约每天 10 次手动请求。4 个 URL 用不到一半，无需省着用：

| # | URL | 2026-10-21 已验证 |
|---|---|---|
| 1 | https://balancebiketoddler.com/guides/budget/balance-bike-price-tiers | 200，在 sitemap |
| 2 | https://balancebiketoddler.com/guides/beginner/balance-bike-by-age | 200，在 sitemap |
| 3 | https://balancebiketoddler.com/guides/beginner/balance-bike-what-buyers-say | 200，在 sitemap |
| 4 | https://balancebiketoddler.com/guides/scenario/balance-bike-stability | 200，在 sitemap |

逐个操作：

1. 粘贴到顶部搜索框（网址检查）
2. 确认「网址是否已在 Google 上建立索引」显示为否，否则跳过
3. **请求编入索引** → 等确认弹窗

**顺序有讲究**：先请求 #2 和 #3——它们是参考页集群和页脚都链向的主题页，
它们的收录状态决定了 Google 看到的内链图是否完整。

---

## 不要重做的事

- **不要**逐个手动提交商品/类目页。它们由 sitemap 和 IndexNow 覆盖
  （IndexNow 只到 Bing/Yandex/Naver/Seznam，原因见开头）。
- **不要**在内容没变的情况下对上面 4 个 URL 反复「请求编入索引」。重复
  请求对未变动的 URL 没有推动作用，只是烧配额。

## 复查节点

下一份 GSC 导出预计 **2026-10-22 ~ 24**（任务板 #40）。应能看到：4 篇新
指南的展现量，以及面包屑问题是否已清除。如果导出显示新指南展现仍为零，
原因更可能是主题竞争（它们与老得多的 hub 页争夺同一批查询）而非技术问题
——与 `gsc-2026-10-13-analysis_zh.md` 里的基线对比即可判断。
