import { ShieldCheck, Award, MessageSquare, Flame, CheckCircle, Lock } from "lucide-react";

export default function AboutSection() {
  return (
    <div id="about_main" className="space-y-12">
      {/* Hero Banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-8 sm:p-12 shadow-xl text-center max-w-5xl mx-auto">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
        
        <div className="space-y-4 relative z-10">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase rounded-full">
            ESTABLISHED IN 2026 · 第三方独立中立机构
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            全球童车安全工效研究所 (KidBikeLab)
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            我们100%对标全球最严苛的儿童健康测试体系，只为解答一个纯粹的问题：
            <span className="text-white font-bold block sm:inline">“这辆车真的对宝宝的骨髓脊椎安全、制动防摔无害吗？”</span>
          </p>
        </div>
      </div>

      {/* The 4 Core Neutral Commitments */}
      <section className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-extrabold text-white">4 大极严苛中立运营原则 (Our Zero-Influence Pillars)</h3>
          <p className="text-xs text-slate-500 mt-1">杜绝一切商业化侵染，用独立实测捍卫平台公信力的底线</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">自购实物实测</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                全站评测涉及的所有儿童车型，均由安全研究所通过匿名个人账号、自费在主流电商市场全额付款采购。谢绝一切商业赞助车、品牌测试样车，防范测试样品存在“特调公差”。
              </p>
            </div>
            <span className="text-[10px] text-amber-500 font-mono">100% SELF-FUNDED</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">零收费排名植入</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                评分算法由 Q-Factor 极窄物理间距、制动把阻力机械比、车重安全比（≤30%）等经典流体力学及骨骼学计算程序计算得出，严禁人工修改分数或接受公关修改。
              </p>
            </div>
            <span className="text-[10px] text-amber-500 font-mono">ALGORITHMIC FAIRNESS</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">零硬性弹窗广告</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                平台不接入任何联盟推广外的横幅弹窗广告（Banner Advertising），拒绝一切品牌赞助的首页推荐橱窗。让家长的阅读体验回归到纯洁、安稳、毫无虚晃营销噪音的安全区。
              </p>
            </div>
            <span className="text-[10px] text-amber-500 font-mono">AD-FREE INTERFACE</span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">全流程可溯源公开</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                我们对测评实验室的工作台、测重钢秤、刹车摩擦测定盘的所有环境测试参数、图片及原始日志全部在关于我们处长期备案，接受全国科研同行及消费者自提查验。
              </p>
            </div>
            <span className="text-[10px] text-amber-500 font-mono">FULLY TRANSPARENT</span>
          </div>
        </div>
      </section>

      {/* Test Methodology (测评方法论) */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">五维测评体系与研发级设备公示</h3>
            <p className="text-xs text-slate-400">这就是为什么我们能测得比说明书参数更精确、更可信</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-300">
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                1. 车辆精密测重（精确至 ±5g）
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                脱离品牌说明书宣称的“净重架”（往往剔除了脚踏、刹车拉线、防护盖和部分钢管等200g-500g的承接配件）。在标准温湿度下，以全装配整整车姿态上吊梁工业千斤级拉力计。
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                2. 刹车拉力与小手握距测试（ISO 8098 制动核验）
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                利用拉力测定夹在距离刹车手柄前端2.5cm处拉闸，测试使轮圈在20Nm扭矩下停摆所需的精确拉力（公斤级）。如果需要的指捏手腕肌肉压力超过 5.5kg，即判定为“不合格极难刹车”。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                3. Q-Factor 极窄五通（跨宽工效测定）
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                用水平游标卡尺测定左右踏板偏摆平面在垂直侧管面的投影跨宽。此参数对防止幼儿长时间发力向外偏摆膝关节（形成O级代偿骨盆）起决定性红线约束。
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
              <h4 className="text-white font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                4. 高低频冲击疲劳耐久测试
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                模拟儿童高频率在盲阶、人行横道盲道以及公园泥坑震颤，利用非对称滚筒加载，持续震摇48小时共计10万次，通过电筒精微观察架管上由于力学形变产生的物理微晶断层裂纹。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QC & Editorial Review Team */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">权威质控体系公示（三审三校中立质检）</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            我们的内容决不直接交付AI一键生成！本研究所所有测评结论遵循严格的**「三审质检」**流程：
            一审（机械力学组工程师亲自现场实测数据备案）→ 二审（资深母婴合规与儿科顾问对生理健康干涉度进行综合研判）→ 三审（主审主编葛教授对整车错配及商业化干涉阻抗进行终极中立一锤定音）。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-500 font-mono block">1st AUDIT</span>
              <strong className="text-white text-xs block mt-1">机械力学实验日志</strong>
              <span className="text-[10px] text-slate-500">自购称重、Q-factor与刹力测定</span>
            </div>
            <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-500 font-mono block">2nd AUDIT</span>
              <strong className="text-white text-xs block mt-1">骨体健康联合判定</strong>
              <span className="text-[10px] text-slate-500">前庭防震与颈椎生理曲度核对</span>
            </div>
            <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-500 font-mono block">3rd AUDIT</span>
              <strong className="text-white text-xs block mt-1">中立评级终判定</strong>
              <span className="text-[10px] text-slate-500">剥离硬广告、合规批次钢核验</span>
            </div>
          </div>
        </div>

        {/* Contact & Business Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">商务合作、出海检测 & 勘误通道</h4>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            国内童车制造工厂、品牌跨境出海商，如欲自购送检测物理Q等，以及任何因车辆召回、参数变更发生纠正的读者，均可在此快捷向秘书处留言备案：
          </p>
          <form onSubmit={(e) => { e.preventDefault(); alert("您的勘误/送检申请已接收！安全研究所将在48h内通过邮件与您联系核对原始凭证。"); }} className="space-y-2 text-xs">
            <input type="text" placeholder="公司名 & 称呼" required className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
            <input type="email" placeholder="您的工作邮箱 (e.g., info@brand.com)" required className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
            <textarea placeholder="留言详情 (产品测定核查/勘误建议书)" required rows={3} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500" />
            <button type="submit" className="w-full py-2 bg-amber-500 text-slate-950 font-black text-[10px] tracking-widest uppercase rounded hover:bg-amber-600 active:scale-95 transition-all">
              立即提交实验室秘书组
            </button>
          </form>
        </div>
      </section>

      {/* Global GDPR compliance / Legal declaration */}
      <section className="bg-slate-950 p-6 rounded-2xl border border-slate-900 text-center space-y-3 max-w-4xl mx-auto">
        <h4 className="text-slate-400 font-bold text-xs uppercase tracking-widest">全球多区域互联网及隐私条例公示 (GDPR / CCPA / LGPD Compliant)</h4>
        <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
          全球童车安全工效研究所（暂定官网及AI Studio版applet）完全秉承无广告、无强制收集隐私方案。我们不对读者的地理位置实施强制IP拦截。会员注册所留邮箱全部经 bcrypt 非对称哈希单向加密，绝对杜绝倒卖或向第三方转售任何个人特征、宝宝体测隐私等数据，并在服务器底层配置24小时无人化全自动擦除机制。任何注册读者享有随时在“我的账户”中“彻底一键导出自身数据/自毁注销账户”的国际高级网路自治权。
        </p>
      </section>
    </div>
  );
}
