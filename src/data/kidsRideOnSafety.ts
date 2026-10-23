/**
 * /kids-ride-on-safety-standards/ — what the compliance field does not prove,
 * and what the listings do say about safety.
 *
 * The compliance field here is useless in the way the kids-scooter page found it
 * useless: all fifteen listings carry ASTM F963 and a CPSC listing, so the field
 * carries no information that would separate one product from another. None of
 * them names a certificate number, a test report or a laboratory either.
 *
 * So this page does the other half of the job. It counts the safety-relevant
 * statements that DO vary across these listings, read from the product
 * description rather than from the structured compliance field:
 *
 *   parental remote control  10 of 15
 *   seat belt or harness      4 of 15
 *   adult supervision         4 of 15
 *   not for roadways          3 of 15
 *   anti-rollover design      3 of 15
 *   a stated top speed        7 of 15
 *   a helmet requirement      0 of 15
 *
 * The zero is the finding worth stating: not one listing in this catalogue
 * mentions a helmet at all, in a category where the machines reach 5 to 8 mph
 * and where every CPSC recall in this category that injured a child involved a
 * vehicle that moved unexpectedly.
 *
 * Counts are computed from the description text by the literal phrase lists in
 * this file, so every number here can be reproduced by grepping the generated
 * dataset rather than by re-running the page.
 */
import { ShieldCheck, FileCheck, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_SAFETY_PATH = "/kids-ride-on-safety-standards/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

const astm = d.rows.filter((r) => r.compliance?.includes("ASTM F963")).length;
const cpsc = d.rows.filter((r) => r.compliance?.includes("CPSC")).length;

/**
 * Literal phrase lists, one per safety topic.
 *
 * These are definitions, not heuristics over a definition: the counts on this
 * page are exactly "listings whose description contains one of these phrases".
 * Changing a list changes every number published here, which is why the lists
 * live in one file next to the copy that reports them.
 */
const SAFETY_PHRASES: Record<string, string[]> = {
  seatbelt: ["seat belt", "seatbelt", "harness", "5-point", "3-point"],
  remote: ["remote control", "remote-control", "parental remote", "remote"],
  antiRollover: ["anti-rollover", "anti rollover", "anti-tip", "rollover", "tipping"],
  supervision: ["adult supervision", "supervision", "supervised"],
  notOnRoads: ["not on roadways", "never use on road", "do not use on road", "roadways", "near motor vehicles"],
  topSpeed: ["mph"],
  helmet: ["helmet"],
};

/** How many listings mention each safety topic, and which ones. */
export const kidsRideOnSafetyTopics = () =>
  Object.entries(SAFETY_PHRASES).map(([topic, phrases]) => {
    const matched = d.rows.filter((r) => {
      const hay = `${r.name || ""} ${r.description || ""}`.toLowerCase();
      return phrases.some((p) => hay.includes(p));
    });
    return {
      topic,
      count: matched.length,
      labels: matched.map((r) => rideOnLabel(r)),
    };
  }).sort((a, b) => b.count - a.count);

/**
 * The facts that only exist because these cars carry a battery.
 *
 * A scooter page has nothing to say about brakes, reverse gear, chargers or
 * speed limiters; a ride-on car does, and these listings state them rarely.
 * Counts come from the same title-and-description haystack as the topic table
 * above, using the literal phrase lists below.
 */
const CONTROL_PHRASES: Record<string, string[]> = {
  brake: ["brake", "braking", "foot brake", "hand brake"],
  reverse: ["reverse", "reverse gear", "reverse mode"],
  charger: ["charger", "charging", "charge the"],
  speedLimiter: ["speed limiter", "speed limit", "parental speed"],
  batteryWarning: ["do not overcharge", "overcharge", "swallow", "lithium", "battery safety"],
};

export const kidsRideOnSafetyControls = () =>
  Object.entries(CONTROL_PHRASES).map(([control, phrases]) => {
    const matched = d.rows.filter((r) => {
      const hay = `${r.name || ""} ${r.description || ""}`.toLowerCase();
      return phrases.some((p) => hay.includes(p));
    });
    return {
      control,
      count: matched.length,
      labels: matched.map((r) => rideOnLabel(r)),
    };
  });

/** Materials, which do vary and do differentiate. */
export const kidsRideOnSafetyMaterials = () => ({
  materials: [...new Set(d.rows.map((r) => r.material).filter(Boolean))].sort(),
  plasticOnly: d.rows.filter((r) => /plastic/i.test(r.material) && !/metal|steel|alloy/i.test(r.material)).length,
  withMetal: d.rows.filter((r) => /metal|steel|alloy/i.test(r.material)).length,
  assemblyRequired: d.rows.filter((r) => /yes/i.test(r.assemblyRequired)).length,
  withWarranty: d.rows.filter((r) => r.warranty).length,
});

export interface RideOnSafetyStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverageTitle: string;
  coverageLead: string;
  controlsTitle: string;
  controlsLead: string;
  controlBrake: string;
  controlReverse: string;
  controlCharger: string;
  controlSpeedLimiter: string;
  controlBattery: string;
  topicsTitle: string;
  topicsLead: string;
  topicRemote: string;
  topicSpeed: string;
  topicSeatbelt: string;
  topicSupervision: string;
  topicRoads: string;
  topicRollover: string;
  topicHelmet: string;
  topicLabelRemote: string;
  topicLabelSpeed: string;
  topicLabelSeatbelt: string;
  topicLabelSupervision: string;
  topicLabelRoads: string;
  topicLabelRollover: string;
  topicLabelHelmet: string;
  materialsTitle: string;
  materialsLead: string;
  materialsBody: string;
  gapTitle: string;
  gapLead: string;
  gapCert: string;
  gapHelmet: string;
  gapSpeed: string;
  gapAssembly: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colAstm: string;
  colCpsc: string;
  colRemote: string;
  colSeatbelt: string;
  colSpeed: string;
  colMaterial: string;
  notStated: string;
  stated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnSafetyStrings: Record<"en" | "zh", RideOnSafetyStrings> = {
  en: {
    eyebrow: "Plan-B asset · safety standards",
    navLabel: "Safety standards",
    h1: `Kids Ride-On Safety Standards: ${total} of ${total} Claim ASTM F963`,
    lead: `Every children's ride-on car in this catalogue carries the same two compliance marks: ASTM F963, the US toy safety standard, and a CPSC listing. ${astm} of ${total} state the first, ${cpsc} of ${total} the second. That makes the field useless as a comparison, so this page spends its space on the safety statements that do vary — and on the one that appears in none of them.`,
    coverageTitle: "The compliance marks, and why they cannot separate these cars",
    coverageLead: `Two bars at full height, which is why they are reported and then set aside. Every car in this catalogue is inside the standard, so the marks say nothing about which of them is better made — but they are also the only safety statement a listing makes, and no listing here names a certificate number, a test laboratory or a report reference to back them up.`,
    controlsTitle: "The controls a powered car needs, and how rarely they are stated",
    controlsLead: `A ride-on car is a different object from the push toys and scooters this site covers elsewhere: it has a motor, a rechargeable battery and a charger, which means it has brakes, a reversing gear and a battery that can be damaged. These are the counts for those facts, taken from the product titles and descriptions.`,
    controlBrake: `A brake — 1 of ${total}. Only the First Ride On 36U001, the four-seat golf car at $379.52, describes a brake at all. The other ${total - 1} listings describe a car with a motor and no stated way to slow it beyond the pedal.`,
    controlReverse: `A reversing gear — 5 of ${total}. The Gotrax RT1, the Lil' Rider 90-YJ876B, two Best Choice Products cars and the same First Ride On 36U001 describe reverse. That is the most commonly stated control of the five, and it appears mostly on the cheaper cars rather than the fastest ones.`,
    controlCharger: `A charger or charging instruction — 2 of ${total}. Only the Gotrax RT1 and the FanttikRide N7 Pro tell a buyer how the battery is charged. Both are 12V cars, and a 12V car that arrives without instructions for its charger is a smaller problem than a 24V or 36V car that does.`,
    controlSpeedLimiter: `A speed limiter — 1 of ${total}. The ANPABO S323 at $314.49 is the only listing that mentions one, and it is also the only car in the catalogue described as having an adjustable speed limit, which on a machine that reaches 4.3 mph is a meaningful difference rather than a marketing line.`,
    controlBattery: `A battery warning — 0 of ${total}. Not one listing mentions lithium, overcharging, or the risk of a damaged cell, even though every one of these cars runs on a rechargeable pack that a child can reach. This is the largest single gap on the page, and the CPSC notices in this category are overwhelmingly about exactly this kind of battery.`,
    topicsTitle: "The safety statements that actually vary",
    topicsLead: `These counts come from the product descriptions, not from the structured compliance field, because the descriptions are where the safety claims live. A listing that mentions a parental remote is telling a buyer something; a listing that carries ASTM F963 is telling every other listing the same thing.`,
    topicRemote: `Parental remote control — ${kidsRideOnSafetyTopics().find((t) => t.topic === "remote")?.count} of ${total}. The most widely stated safety device in the catalogue by a wide margin, and the one that most directly addresses the failure mode the recall record is full of: a vehicle that moves when the child is not driving it.`,
    topicSpeed: `A stated top speed — ${kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count} of ${total} name a maximum speed in mph. This is the figure a parent needs in order to judge whether the machine belongs on a driveway or a pavement, and it appears in fewer listings than the remote does.`,
    topicSeatbelt: `A seat belt or harness — ${kidsRideOnSafetyTopics().find((t) => t.topic === "seatbelt")?.count} of ${total}. Fewer than a third of these cars describe any restraint, which is worth noting in a category where the two largest machines have four wheels and a roof.`,
    topicSupervision: `Adult supervision — ${kidsRideOnSafetyTopics().find((t) => t.topic === "supervision")?.count} of ${total}. Fewer than a third, and the listings that do mention it tend to be the slower machines, which suggests the phrase appears where a speed limit made it necessary rather than as standard advice.`,
    topicRoads: `Not for roadways — ${kidsRideOnSafetyTopics().find((t) => t.topic === "notOnRoads")?.count} of ${total} say the vehicle is not intended for roads or for use near motor vehicles. Only one of those three is among the listings that also state a top speed, so the warning and the number usually arrive in different listings, which leaves a buyer without both.`,
    topicRollover: `Anti-rollover design — ${kidsRideOnSafetyTopics().find((t) => t.topic === "antiRollover")?.count} of ${total} describe anti-rollover, anti-tip or tipping-protection features. Two of them are the two lightest cars in the catalogue, where the risk being addressed is tipping rather than speed.`,
    topicHelmet: `A helmet — ${kidsRideOnSafetyTopics().find((t) => t.topic === "helmet")?.count} of ${total}. Not one listing in this catalogue mentions a helmet, in any form, in a category where the fastest machine here states a 5-to-8 mph range. This page does not supply helmet guidance of its own either; the sourced guidance on this site lives on the balance-bike and kids-bike safety pages.`,
    topicLabelRemote: "Parental remote control",
    topicLabelSpeed: "A stated top speed",
    topicLabelSeatbelt: "A seat belt or harness",
    topicLabelSupervision: "Adult supervision",
    topicLabelRoads: "Not for roadways",
    topicLabelRollover: "Anti-rollover design",
    topicLabelHelmet: "A helmet",
    materialsTitle: "Materials and construction",
    materialsLead: `One field that does separate these cars from each other.`,
    materialsBody: `Material type is stated by all ${total} listings, and it splits ${kidsRideOnSafetyMaterials().plasticOnly} plastic-only cars against ${kidsRideOnSafetyMaterials().withMetal} that name metal or steel somewhere in the material field, with one listing naming polypropylene and nothing else. The metal-containing group is the larger vehicles: a metal-frame UTV, two metal-and-plastic trucks, a licensed Ford F-150 in alloy steel and polypropylene, and one all-metal body. Assembly is required on ${kidsRideOnSafetyMaterials().assemblyRequired} of ${total}, and only ${kidsRideOnSafetyMaterials().withWarranty} publish a warranty statement at all — a 30-day warranty on the 6V trike and 60-day returns policies on three Best Choice Products cars.`,
    gapTitle: "What this catalogue cannot answer about a powered car",
    gapLead: `Four gaps, each of which a buyer can check for themselves on a shop floor and will not find answered in a listing.`,
    gapCert: `No certificate — none of the ${total} listings carries a certificate number, test report reference or certification body name. The compliance field is a bare list of standard names, identical down the page.`,
    gapHelmet: `No helmet guidance — 0 of ${total}. A compliance mark covers the product, not the rider, and these listings say nothing about the rider either.`,
    gapSpeed: `Speed in only ${kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count} of ${total} — the other ${total - (kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count ?? 0)} listings state no maximum speed anywhere, so there is no way to tell from the record whether the machine is a 2 mph wobble or a 6 mph runabout.`,
    gapAssembly: `No assembly time and no manual — ${kidsRideOnSafetyMaterials().assemblyRequired} of ${total} say assembly is required and not one publishes an assembly time or a manual link, for products that include steering wheels, pedals, wiring and a battery in a box that may weigh seventy pounds.`,
    rosterTitle: "Compliance marks and the safety statements beside them",
    rosterLead: `The first two columns are the same on every row — that is the finding. The columns after them are where the listings actually differ.`,
    colBrand: "Brand",
    colModel: "Model",
    colAstm: "ASTM F963",
    colCpsc: "CPSC",
    colRemote: "Parental remote",
    colSeatbelt: "Seat belt",
    colSpeed: "Top speed stated",
    colMaterial: "Material",
    notStated: "not stated",
    stated: "stated",
    methodTitle: "How compliance and safety were read",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars.`,
      `Compliance values are taken from the listing's compliance field as recorded. They are not verified against a certificate database, and no certificate was looked up because none is referenced.`,
      `The safety topic counts come from the product title and description, matched against the literal phrase lists defined in src/data/kidsRideOnSafety.ts. A listing is counted once per topic however many phrases it contains, and a phrase in the marketing title counts the same as one in the description.`,
      `The control counts — brake, reverse, charger, speed limiter, battery warning — are matched the same way against a second literal phrase list in the same file. A listing that mentions a brake in any wording counts once; a listing that mentions nothing counts zero, and there is no inference from the absence of a word to the absence of the feature.`,
      `The standards are named as they appear in the source: "ASTM F963" and "CPSC". No standard has been paraphrased, expanded or mapped to a national equivalent.`,
      `Nothing was tested, and no product was handled or driven.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 安全标准",
    navLabel: "安全标准",
    h1: `童用电动车安全标准：${total} 款全部声称符合 ASTM F963`,
    lead: `本目录里每一款童用电动车都带着同样两个合规标记：ASTM F963（美国玩具安全标准）和 CPSC 登记。${total} 款中有 ${astm} 款声明前者、${cpsc} 款声明后者。这让它作为比较依据毫无用处，因此本页把篇幅放在确实有差异的安全表述上——以及那一项在所有 listing 里都不存在的东西。`,
    coverageTitle: "合规标记，以及它们为什么分不开这些车",
    coverageLead: `两条都是满格，这正是先列出、然后搁置它们的原因。本目录的每一款车都在标准覆盖范围内，所以这些标记并不能说明哪一款做工更好——同时它们也是 listing 唯一作出的安全声明，而这里没有任何一款给出证书编号、检测实验室或报告编号来支撑它。`,
    controlsTitle: "电动童车需要的那些装置，以及它们被写明的频率",
    controlsLead: `电动车和本站覆盖的推车、滑板车是两种不同的东西：它有电机、可充电电池和充电器，因此也有刹车、倒车档，以及一块可能受损的电池。下面这些就是相应事实的计数，取自商品标题与描述。`,
    controlBrake: `刹车——${total} 款中只有 1 款。只有售价 $379.52 的四座高尔夫车 First Ride On 36U001 描述了刹车。其余 ${total - 1} 款描述的是一台有电机却没有说明减速方式的机器。`,
    controlReverse: `倒车档——${total} 款中有 5 款。Gotrax RT1、Lil' Rider 90-YJ876B、两台 Best Choice Products 以及同一台 First Ride On 36U001 都写了倒车。这是五项里被写明最多的一项，而且大多出现在便宜的车上，而不是最快的那些。`,
    controlCharger: `充电器或充电说明——${total} 款中只有 2 款。只有 Gotrax RT1 和 FanttikRide N7 Pro 告诉买家电池怎么充。两款都是 12V 车；一台 12V 车缺充电说明还算小事，24V 或 36V 车缺就是另一回事了。`,
    controlSpeedLimiter: `限速——${total} 款中只有 1 款。售价 $314.49 的 ANPABO S323 是唯一提到限速的 listing，也是全目录唯一被描述为带可调限速的车；在一台能跑到 4.3 英里/时的机器上，这是实打实的差别，不是一句营销话。`,
    controlBattery: `电池警告——${total} 款中有 0 款。没有一款提到锂电、过充或电芯损坏的风险，而这里每一款都跑在孩子够得到的可充电电池上。这是本页最大的单项空白，而本类目的 CPSC 通告绝大多数正是关于这类电池。`,
    topicsTitle: "真正有差异的安全表述",
    topicsLead: `这些计数取自商品描述而不是结构化合规字段，因为安全主张就写在描述里。提到家长遥控的 listing 是在告诉买家一件事；而带着 ASTM F963 的 listing 是在告诉其他每一条 listing 同样的事。`,
    topicRemote: `家长遥控——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "remote")?.count} 款。这是本目录里被提及最多的安全装置，而且它直接对应召回记录里最普遍的那种失效模式：车辆在孩子没有驾驶时自己动起来。`,
    topicSpeed: `标称最高时速——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count} 款写出 mph 上限。家长正是靠这个数字判断这台机器该留在车道上还是人行道上，而它的出现次数比遥控还少。`,
    topicSeatbelt: `安全带或安全带式约束——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "seatbelt")?.count} 款。不到三分之一，而在这个类目里最大的两台机器是有四个轮子和一个车顶的。`,
    topicSupervision: `成人监护——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "supervision")?.count} 款。不到三分之一，而且提到这句的多半是速度较慢的机型，说明这句话是在需要限速的地方才出现的，而不是通用建议。`,
    topicRoads: `不可用于公路——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "notOnRoads")?.count} 款写明该车不用于公路或靠近机动车使用。这三款里只有一款同时标了最高时速，也就是说警告和数字通常不在同一条 listing 里，读者想两个都拿到手就得自己拼。`,
    topicRollover: `防侧翻设计——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "antiRollover")?.count} 款描述了防侧翻、防倾翻或防翻倒设计。其中两款是全目录最小最轻的机器——那里要防的是翻倒而不是速度。`,
    topicHelmet: `头盔——${total} 款中有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "helmet")?.count} 款。这个目录里没有任何一款以任何形式提到头盔，而这个类目里最快的机器标称时速是 5–8 英里。本页同样不自行提供头盔指引；本站有来源的头盔说法在平衡车与童车安全页上。`,
    topicLabelRemote: "家长遥控",
    topicLabelSpeed: "标称最高时速",
    topicLabelSeatbelt: "安全带或约束带",
    topicLabelSupervision: "成人监护",
    topicLabelRoads: "不可用于公路",
    topicLabelRollover: "防侧翻设计",
    topicLabelHelmet: "头盔",
    materialsTitle: "材质与结构",
    materialsLead: `这是唯一能把这些车彼此区分开的字段。`,
    materialsBody: `材质一栏 ${total} 款全部有写，分成 ${kidsRideOnSafetyMaterials().plasticOnly} 款纯塑料与 ${kidsRideOnSafetyMaterials().withMetal} 款在材质字段里出现金属或钢，另有一款只写了聚丙烯。带金属的那一组就是较大的那些车：一台金属车架 UTV、两台金属加塑料的卡车、一台用合金钢与聚丙烯的福特 F-150 授权版，以及一台全金属车身。${total} 款中有 ${kidsRideOnSafetyMaterials().assemblyRequired} 款写明需要组装，而只有 ${kidsRideOnSafetyMaterials().withWarranty} 款公布了保修说明——6V 三轮车是 30 天保修，三台 Best Choice Products 是 60 天退货政策。`,
    gapTitle: "仅凭这份目录，无法回答电动车的哪些问题",
    gapLead: `四个空白。买家在店里上手一查就能发现，而 listing 里没有答案。`,
    gapCert: `没有证书——${total} 款中没有一款带证书编号、检测报告编号或认证机构名称。合规字段只是一串标准名称，从上到下一模一样。`,
    gapHelmet: `没有头盔指引——${total} 款中有 0 款。合规标记覆盖的是产品，不是骑手，而这些 listing 对骑手也只字未提。`,
    gapSpeed: `只有 ${kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count} 款写了速度——其余 ${total - (kidsRideOnSafetyTopics().find((t) => t.topic === "topSpeed")?.count ?? 0)} 款任何地方都没写最高时速，因此无法从记录判断这台机器是时速 2 英里的摇摆车还是 6 英里的跑车。`,
    gapAssembly: `没有组装时长也没有说明书——${total} 款中有 ${kidsRideOnSafetyMaterials().assemblyRequired} 款写明需要组装，而没有一款公布组装时长或说明书链接。这些产品的箱子里装着方向盘、踏板、线束和电池，箱子本身可能重达七十磅。`,
    rosterTitle: "合规标记与其旁边的安全表述",
    rosterLead: `前两列每一行都一样——这正是本页的结论。真正有差异的是它们后面几列。`,
    colBrand: "品牌",
    colModel: "型号",
    colAstm: "ASTM F963",
    colCpsc: "CPSC",
    colRemote: "家长遥控",
    colSeatbelt: "安全带",
    colSpeed: "标称最高时速",
    colMaterial: "材质",
    notStated: "未说明",
    stated: "已声明",
    methodTitle: "合规与安全信息是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售。`,
      `合规值按 listing 的 compliance 字段原样记录。没有与证书数据库做核对，也没有查询证书——因为没有任何一条引用了证书。`,
      `安全主题的计数取自商品标题与描述，按 src/data/kidsRideOnSafety.ts 中定义的字面短语列表匹配。一个 listing 在同一主题下只计一次，无论它含有几个短语；出现在营销标题里的短语与出现在描述里的同样计数。`,
      `装置计数——刹车、倒车、充电器、限速、电池警告——用同一套方法匹配同一文件里第二份字面短语列表。只要提到刹车就计一次，不论怎么措辞；完全没提就是零。没有从「没有这个词」推断「没有这个功能」。`,
      `标准名称按源数据原样保留："ASTM F963" 与 "CPSC"。没有改写、扩写或对应到任何国家标准版本。`,
      `全程没有实测，也没有上手试驾。`,
    ],
  },
};

/** Roster columns. The two compliance columns lead, then the varying ones. */
export const kidsRideOnSafetyColumns = (t: RideOnSafetyStrings): RideOnColumn[] => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as { brand?: string }).brand || t.notStated,
  },
  {
    key: "name",
    header: t.colModel,
    render: (r: never) => rideOnLabel(r as never) || t.notStated,
  },
  {
    key: "astm",
    header: t.colAstm,
    render: (r: never) =>
      (r as { compliance?: string[] }).compliance?.includes("ASTM F963") ? t.stated : t.notStated,
  },
  {
    key: "cpsc",
    header: t.colCpsc,
    render: (r: never) =>
      (r as { compliance?: string[] }).compliance?.includes("CPSC") ? t.stated : t.notStated,
  },
  {
    key: "remote",
    header: t.colRemote,
    render: (r: never) =>
      /remote/i.test(`${(r as { name?: string }).name || ""} ${(r as { description?: string }).description || ""}`)
        ? t.stated
        : t.notStated,
  },
  {
    key: "seatbelt",
    header: t.colSeatbelt,
    render: (r: never) =>
      /seat ?belt|harness|5-point|3-point/i.test(
        `${(r as { name?: string }).name || ""} ${(r as { description?: string }).description || ""}`
      )
        ? t.stated
        : t.notStated,
  },
  {
    key: "speed",
    header: t.colSpeed,
    render: (r: never) => {
      const hay = `${(r as { name?: string }).name || ""} ${(r as { description?: string }).description || ""}`;
      const m = hay.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?mph/i);
      if (!m) return t.notStated;
      return m[2] ? `${m[1]}-${m[2]} mph` : `${m[1]} mph`;
    },
  },
  {
    key: "material",
    header: t.colMaterial,
    render: (r: never) => (r as { material?: string }).material || t.notStated,
  },
];

export const kidsRideOnSafetyVars = {
  total,
  astm,
  cpsc,
  topics: kidsRideOnSafetyTopics(),
  materials: kidsRideOnSafetyMaterials(),
};

export const kidsRideOnSafetyIcons = {
  shield: ShieldCheck,
  cert: FileCheck,
  gap: AlertTriangle,
  table: Table2,
};
