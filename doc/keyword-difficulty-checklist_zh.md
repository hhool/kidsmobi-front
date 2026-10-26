# 站点主关键词难度调研清单（Ahrefs / Semrush 版）

> 目的：在落地「5 个站点主关键词」策略前，先用你自己的 Ahrefs / Semrush 账号跑出**真实 KD（关键词难度）、月搜索量、CPC、SERP 格局**。本文件只提供可复制粘贴的查询清单 + 操作 SOP，**不替代数据**——所有判定以你账号导出的数字为准。
>
> 5 个主词：balance bike、electric car（for kids）、double stroller、jogger stroller、travel stroller。
> 对应站点集群：balance-bike、kids-ride-on、kids-stroller。

---

## 一、Head-term（5 个，先查这 5 个）

直接粘贴进 Ahrefs Keywords Explorer 或 Semrush Keyword Magic Tool 的批量框（每行一个）：

```
balance bike
electric car for kids
kids electric car
double stroller
jogger stroller
travel stroller
```

⚠️ **意图红线**：裸 `electric car` 不要查——那是 Tesla/日产/通用的词，KD 80+，儿童站永远排不上。只查 `electric car for kids` / `kids electric car`（儿童意图）。站点现 `all` 默认块写的 `kids electric bike` 是错词，实施时改掉。

⚠️ **double vs twin**：真实搜索量 `double stroller` ≫ `twin stroller`。全站统一用 double，不要再用 twin。

---

## 二、长尾变体（按 head-term 分组，约 40 条，可直接批量导入）

### 1) balance bike（已有 7 页基础，补年龄/场景长尾）
```
balance bike for 1 year old
balance bike for 2 year old
balance bike for 3 year old
best balance bike 2026
balance bike for toddlers
balance bike with brakes
wooden balance bike
balance bike vs training wheels
12 inch balance bike
lightweight balance bike
balance bike age range
balance bike helmet
```

### 2) electric car for kids（需求最大 + 已有 kids-ride-on 集群）
```
electric car for kids
kids electric car
ride on car for kids
12v kids electric car
24v ride on car
electric ride on car with remote control
kids electric car with parental control
best electric car for kids 2026
toddler electric car
2 seater ride on car
ride on car for 2-5 year olds
cheap kids electric car
kids electric car 12v with remote
```

### 3) double stroller（并入 strollers hub，主攻可赢长尾）
```
best double stroller 2026
double stroller for twins
side by side double stroller
double stroller for infant and toddler
lightweight double stroller
double stroller for travel
best double travel stroller
double jogging stroller
compact double stroller
double stroller for newborn and toddler
tandem double stroller
graco double stroller
```

### 4) jogger stroller（并入 strollers hub，长尾做但预期最慢）
```
best jogging stroller 2026
jogging stroller for trails
double jogging stroller
jogging stroller for baby
lightweight jogging stroller
jogging stroller with car seat
bob jogging stroller
jogging stroller for newborns
best jogging stroller for runners
affordable jogging stroller
jogging stroller vs regular stroller
```

### 5) travel stroller（需求最大、长尾最长，优先做）
```
best travel stroller 2026
travel stroller for airplane
travel stroller for toddler
lightweight travel stroller
compact travel stroller
travel stroller for 2 year old
best travel stroller for airplane 2026
travel stroller with car seat
umbrella travel stroller
travel stroller for newborn
foldable travel stroller
travel stroller for cruise
best travel stroller for 3 year old
```

---

## 三、Ahrefs 操作 SOP（推荐，KD 刻度最直观）

1. 登录 → **Keywords Explorer**。
2. 顶部切换国家/地区（美国站选 `United States`，语言 `English`）。
3. 把上面任意一组（head-term 或某类长尾）整体粘贴进搜索框右侧的 **“Multiple keywords”** 图标 → 批量分析。
4. 看每个词的：**KD（关键词难度 0–100）**、**Volume（月搜索量）**、**CPC**、**Clicks**、**Parent Topic**、**SERP 概览（前 10 域名 DR）**。
5. 导出：右上角 **Export → CSV**，勾选 `Keyword, Volume, KD, CPC, Clicks, Return Rate, Parent Topic`。
6. 用 **Keyword Magic Tool** 选 `Phrase match`，以 head-term 为种子，可自动扩出更多长尾（本清单是人工精选的种子，工具可补全）。

**KD 刻度速查**（Ahrefs）：KD 0–10 极易；10–30 易；30–50 中等（可赢，长尾主战场）；50–70 难（需 100+ 引用域名）；70+ 极难（巨头霸榜）。

---

## 四、Semrush 操作 SOP（备选）

1. 登录 → **Keyword Magic Tool**。
2. 输入 head-term（如 `travel stroller`），国家选 `United States`，数据库 `Organic`。
3. 看 **KD%**、**Volume**、**CPC**、**Trend**、**SF（SERP 特征）**。
4. 勾选本清单词条 → **+ Add to keyword list** → 导出 CSV（含 `Keyword, Volume, KD%, CPC, Competition`）。
5. 用左侧 `Advanced filters`：`KD <= 49` 筛出可赢长尾。

**KD% 对照**：0–14 极易；15–29 易；30–49 中等；50–69 难；70–100 极难。

---

## 五、结果记录模板（跑完填，我们据此决策）

复制下表，把导出数字填进去（示例行是占位，非真实数据）：

| 关键词 | Volume | KD(Ahrefs) / KD% | CPC | Parent Topic | 前10主导(DR) | 站点现有页? | 判定 |
|---|---|---|---|---|---|---|---|
| balance bike | — | — | — | — | — | 7 页 | 待定 |
| electric car for kids | — | — | — | — | — | kids-ride-on 8 | 待定 |
| double stroller | — | — | — | — | — | strollers hub | 待定 |
| jogger stroller | — | — | — | — | — | strollers hub | 待定 |
| travel stroller | — | — | — | — | — | strollers hub | 待定 |
| best double stroller for travel | — | 34(实测) | — | — | — | 否 | 高优先 |
| travel stroller for airplane | — | — | — | — | — | 否 | 待定 |

---

## 六、判定标准（拿到数据后我们怎么拍板）

- **head-term KD ≥ 50**：不硬刚，只做长尾 hub 路线（指南页 + 内链传权威）。
- **长尾 KD 30–49 且 Volume ≥ 100/月**：列为优先实施页（转化高、可赢）。
- **长尾 KD < 30**：直接做，几乎免费排名。
- **Parent Topic 与 head-term 不一致**：说明搜意图错位，别硬塞。
- **决策输出**：按 Volume×可赢度（KD≤49）排序，产出「优先实施长尾页清单」→ 进入 B 阶段（实施计划）。

---

## 七、下一步

你跑完导出 CSV 后，把数字回填第五节模板（或直接把 CSV 贴给我），我据此：
1. 排序出 **优先长尾页清单**；
2. 给出每个主词的 **hub + 长尾页实施计划**（即之前的 B 方案）；
3. 标注哪些要新建独立 slug、哪些并入现有 `/products/strollers/` hub。
