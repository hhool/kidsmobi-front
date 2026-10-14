# 站点 TDK 关键词审计（2026-10-14）

> 来源：扫描 `src/config/defaultSeo.ts`、`src/App.tsx` 的 `categoryTdkMap`、
> 以及 `src/data/balanceBike*.ts` + `safetyRecallRecord.ts` 七个参考资产数据文件里的
> `keywords` 数组。本审计只列出**已部署页面实际写出的 TDK（Title / Description / Keywords）**，
> 不做任何外推或热度假设。
>
> ⚠️ 铁律提醒：没有来源与分母的数字不能当信号。除平衡车外，本站点各品类**没有任何
> GSC 或关键词工具的真实量据**，所以下面只是「当前已部署的关键词覆盖」，不是「热度排名」。

---

## 0. 一个必须先说清的前提

Google 自 2019 年起已**不把 `<meta name="keywords">` 作为排名信号**，但 Bing / Yandex /
DuckDuckGo 仍会参考，且关键词数组本身也常被用来做内部锚文本与同义词覆盖。本站**仍在维护**
关键词数组，且通过 SPA 在水合后动态写入 meta。

但实测发现：预渲染的静态 `dist/*.html` 里** 247 个页面全部没有 keywords meta**——
它只在浏览器 hydration 后由 `App.tsx` 写入。这与之前「标题静态版 vs 水合版两套」是**同一类问题**
（见 `doc/` 里 2026-10-14 的标题统一提交）。爬虫拿到的静态页只有 T+D，没有 K。

---

## 1. 全站关键词现状（按板块）

### 1.1 默认 TDK —— 无专属页面的路由兜底（`defaultSeo.ts`）

| 板块 | EN keywords | ZH keywords |
|---|---|---|
| Home | balance bike · kids bikes · jogging stroller · kids electric scooter · kids electric cars | 儿童平衡车 · 儿童自行车 · 慢跑婴儿推车 · 儿童电动滑板车 · 儿童电动汽车 |
| /products（通用兜底） | kids bike · balance bike · twin stroller · kids electric scooter | 婴儿推车 · 儿童平衡车 · 儿童自行车 · 儿童滑板车 · 儿童电动车 · 儿童安全座椅 |
| /reviews | travel stroller · toddler bike · stroller reviews | 旅行婴儿推车 · 慢跑婴儿推车 · 婴儿推车评测 · 幼儿自行车 · 儿童自行车 |
| /evaluations | travel stroller · toddler bike · stroller reviews | 旅行婴儿推车 · 慢跑婴儿推车 · 婴儿推车评测 · 幼儿自行车 · 儿童自行车 |
| /guides | how to choose a baby stroller · balance bike for 1 year old | 如何选择婴儿推车 · 1岁平衡车 · 平衡车入门 |
| /news | ⚠️ **`"kids electric bike, electric dirt bike for kids, foldable electric scooter"`**（一条逗号串，见问题③） | 儿童电动自行车 · 儿童越野电动车 · 可折叠电动滑板车 |
| /about | BalanceBikeToddler · independent safety lab · child mobility safety · evaluation methodology | BalanceBikeToddler · 独立安全实验室 · 儿童出行安全 · 评测方法 |

### 1.2 品类 hub 自定义 TDK（`App.tsx` 的 `categoryTdkMap`）

归一化 id 来自 `normalizeProductRouteCategory`：`/products/kids-tricycles/` → `kids_tricycles`，
`/products/electric-cars/` → `electric_vehicles`，其余以此类推。

| 品类 | slug | 归一化 id | 自定义 TDK | EN keywords | ZH keywords |
|---|---|---|:--:|---|---|
| Strollers | /products/strollers/ | stroller | ✅ | jogging / travel / lightweight / twin stroller · baby stroller | 慢跑/旅行/轻便/双人婴儿推车 · 婴儿推车 |
| Balance bikes | /products/balance-bikes/ | balance_bike | ✅ | toddler / kids balance bike · 1 year old · ride-on | 儿童平衡车 · 儿童滑步车 · 1岁 · 平衡训练车 |
| Kids bikes | /products/kids-bikes/ | kids_bikes | ✅ | kids bmx bike · toddler bicycle · training wheels · pedal bike | 儿童自行车 · 儿童单车 · BMX · 带辅助轮 |
| Scooters | /products/kids-scooters/ | kids_scooters | ✅ | kids electric/kick scooter · foldable electric scooter | 儿童电动/脚踏滑板车 · 可折叠 · 三轮 |
| Electric cars | /products/electric-cars/ | electric_vehicles | ✅ | kids electric cars · kids ride on · ride on toys 12v | 儿童电动汽车/电动车 · 12V |
| Safety seats | /products/safety-seats/ | car_seat | ✅ | convertible / booster / infant · child safety car seat | 安全座椅 · 安全提篮 · 成长型 · 侧向防护 |
| **Tricycles** | /products/kids-tricycles/ | **kids_tricycles** | ❌ **缺失** | 回退到通用 /products（stroller/bike 词，**无"三轮车/tricycle"**） | 同上，无三轮车词 |

### 1.3 参考资产（7 页，EN+ZH 最完整）

- **尺寸表** `balance-bike-size-chart`：EN `balance bike size chart / sizing / specs compared / what size / by age`；ZH `平衡车尺寸对照表 / 怎么选尺寸 / 规格对比 / 几岁用`
- **按年龄** `balance-bike-by-age`：EN `for 2/3 year old / 18 month / best for 4 / age range / for 1 / toddler by age / when can use`；ZH `两岁/三岁/18个月/四岁 / 适用年龄 / 一岁 / 按年龄选 / 宝宝几岁可以骑`
- **稳定性·轮距** `balance-bike-stability`：EN `stable track / stability / track width / wheel spacing / anti-tip / 4 wheel / widest / steering limiter`；ZH `稳定性 / 轮距 / 轮间距 / 防侧翻 / 四轮 / 加宽车架 / 转向限位`
- **重量** `balance-bike-weight`：EN `how much weigh / weight / lightweight / vs kids bike / aluminium vs steel / ride-on weight chart / by age`；ZH `重量 / 多重 / 轻量 / 与童车对比 / 铝合金高碳钢 / 重量表`
- **安全标准** `balance-bike-safety-standards`：EN `safety standards / CPSC 16 CFR 1512 / CPSIA / ASTM F963-23 / EN 71 / compliance / regulations`；ZH `安全标准 / CPSIA 铅邻苯 / EN 71 / 合规 / 法规`
- **买家口碑** `balance-bike-what-buyers-say`（资产②）：EN `reviews / what parents say / buyer feedback / worth it / for 2 year old reviews / complaints / best rated`；ZH `评测 / 买家评价 / 值不值得买 / 口碑 / 缺点 / 两岁推荐`
- **召回** `safety/balance-bike-recalls`：EN `recall / CPSC recall list / EU Safety Gate / RAPEX / safety`；ZH `召回 / CPSC 名单 / 欧盟 Safety Gate / RAPEX / 骑行安全`

### 1.4 透明页（7 页）

disclaimer · testing-methodology · certification-lab-notes · terms · privacy ·
search-data · review-count-integrity —— 均为品牌/合规词（BalanceBikeToddler、CPSC、
ASTM F963、ISO 8098 等），无商业关键词。

---

## 2. 三个真问题（从 TDK 内部就能看出）

1. **keywords meta 没进静态 HTML**（247 页全 0）。
   `App.tsx` 在 hydration 后写 `<meta name="keywords">`，但预渲染静态页一个都没写。
   属于「静态 vs 水合两套」的不一致，与标题问题同源。Googlebot 会渲染 JS 最终看到，
   但静态爬虫/边缘缓存副本没有 K。

2. **Tricycles hub 没有自定义 TDK**。
   `categoryTdkMap` 只覆盖 6 个 id，`kids_tricycles` 不在内，于是 26 个商品页的 hub
   回退到通用 `/products` TDK——而那套词全是 stroller/bike，**连"三轮车/tricycle"都没出现**。
   等于裸奔。

3. **News EN 关键词格式错误**。
   写成 `["kids electric bike, electric dirt bike for kids, foldable electric scooter"]`
   —— 一个逗号串被当成**一条**关键词，而不是三条。需拆成数组。

### 附带发现的战略错配（非 bug，但值得记）

- GSC 已验证：站点 **94.7% 的曝光是平衡车**。但 1.1 里 home/products/reviews/evaluations
  的默认 TDK 大量偏向 stroller/bike。
- `/reviews` 与 `/evaluations` 的默认关键词**完全不含 balance bike**，而平衡车是主推品类、
  且有最丰富的参考内容。评测中心的入口词和实际主推内容对不上。

---

## 3. 修复清单（按优先级；P0 为纯配置，P1 需单独拍板）

**P0（一行改动，立即可做）**
- 修 News EN 关键词格式：`["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"]`。
- 给 `kids_tricycles` 加 `categoryTdkMap` 条目（EN+ZH），受 `SEO_TDK_LIMITS` 约束：
  最多 10 词、单条 ≤32 字符、总长 ≤255 字符。建议 EN 含 `tricycle / push tricycle / ride-on tricycle / toddler tricycle`，ZH 含 `儿童三轮车 / 脚踏三轮车 / 遛娃三轮车`。

**P1（需你点头，会动 prerender 脚本）**
- 把 keywords 数组写进预渲染静态 HTML（与标题同修法：让 `prerender-pages.ts` 也 emit
  `<meta name="keywords">`），消除静态/水合两套问题。
- `/reviews`、`/evaluations` 默认关键词补 balance bike 相关词，对齐主推内容。

**P2（战略，待 GSC 验证）**
- 是否给次级品类（尤其库存 74 但已降级的 strollers）做参考簇——须先用该品类各自的
  GSC 数据确认真有需求，否则重复「降级不动链接」那套矛盾。

---

## 4. 结论

站点**没有单一"主推词"**，是一棵以 `balance bike`（平衡车）为根部词、按**属性维度**
（尺寸/年龄/稳定性/重量/安全/召回/口碑）拆出的决策型长尾词簇——这一簇集中在 7 个参考资产页，
EN+ZH 覆盖完整。其余 6 个品类 hub 仅有「Best [品类] 2026」头词 + 描述里点名的子类型，
且 Tricycles 连自定义 TDK 都没有；默认路由 TDK 偏 stroller/bike，与平衡车主推策略存在错配。
先落 P0 两项纯配置修复，性价比最高。
