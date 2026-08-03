export type Locale = "zh" | "en";

type PageCopy = {
  home: {
    overviewLabel: string;
    bannerBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    quickCategories: {
      kidsBike: string;
      balanceBike: string;
      kidsScooter: string;
      joggingStroller: string;
    };
    categoryHighlights: {
      eyebrow: string;
      title: string;
      description: string;
      openProductCenter: string;
      featuredTag: string;
    };
    categoryCards: {
      strollerLabel: string;
      strollerDesc: string;
      balanceLabel: string;
      balanceDesc: string;
      kidsBikeLabel: string;
      kidsBikeDesc: string;
      scooterLabel: string;
      scooterDesc: string;
      electricCarLabel: string;
      electricCarDesc: string;
      carSeatLabel: string;
      carSeatDesc: string;
    };
    safetyAudits: {
      badge: string;
      title: string;
      description: string;
      viewAudits: string;
      morePicks: string;
      noElectricData: string;
      sections: {
        joggingTitle: string;
        joggingDesc: string;
        balanceTitle: string;
        balanceDesc: string;
        kidsBikeTitle: string;
        kidsBikeDesc: string;
        scooterTitle: string;
        scooterDesc: string;
        electricCarTitle: string;
        electricCarDesc: string;
      };
    };
    quickScenarios: {
      title: string;
      description: string;
      cards: {
        newbornLabel: string;
        newbornDesc: string;
        outdoorLabel: string;
        outdoorDesc: string;
        commuteLabel: string;
        commuteDesc: string;
      };
    };
    faq: {
      badge: string;
      title: string;
      description: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
    runtimeLabels: {
      categoryNames: {
        joggingStroller: string;
        balanceBike: string;
        kidsBike: string;
        kidsElectricCar: string;
        kidsScooter: string;
        stroller: string;
        featuredProduct: string;
      };
      evaluating: string;
      fallbackActive: string;
      jsonLdHomeName: string;
    };
  };
  products: {
    breadcrumbsProducts: string;
    heroTitle: string;
    heroSubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    sortLabel: string;
    sortAria: string;
    sortOptions: {
      topRated: string;
      lightweight: string;
      luxuryFirst: string;
      bestValue: string;
    };
    categoriesLabel: string;
    ageLabel: string;
    ageOptions: { all: string; baby: string; toddler: string; child: string };
    priceLabel: string;
    priceOptions: { all: string; budget: string; mid: string; premium: string };
    noMatches: string;
    resetFilters: string;
    expertPicks: string;
    metricsHint: string;
    allProductsLabel: string;
    filterFacets: {
      brandLabel: string;
      selectBrand: string;
      frameLabel: string;
      selectFrame: string;
      tireLabel: string;
      selectTire: string;
      brakeLabel: string;
      selectBrake: string;
      wheelCountLabel: string;
      selectWheelCount: string;
      wheelLabel: string;
      selectWheel: string;
      certificationLabel: string;
      selectCertification: string;
      allOption: string;
    };
    topBadge: string;
    seoPills: {
      balanceBikeToddler: string;
      twinStroller: string;
      toddlerBike: string;
      kidsElectricScooter: string;
    };
    compareLimitTip: string;
    saveTips: {
      loginRequired: string;
      removed: string;
      saved: string;
    };
    productCard: {
      viewMetricsAriaPrefix: string;
      scoreTitle: string;
      capacityTitle: string;
      adminEditTitle: string;
      adminEditLabel: string;
      compareAria: string;
      saveAria: string;
    };
    pagination: {
      prevPageAria: string;
      nextPageAria: string;
      pageAriaPrefix: string;
      pageAriaTemplate: string;
    };
    history: {
      title: string;
      subtitle: string;
    };
    businessCopy: {
      descriptionTemplates: {
        kidsBikeZh: string;
        kidsBikeEn: string;
        balanceBikeZh: string;
        balanceBikeEn: string;
        twinStrollerZh: string;
        twinStrollerEn: string;
        electricScooterZh: string;
        electricScooterEn: string;
      };
      generatedSummary: {
        travelZh: string;
        travelSystemZh: string;
        joggerZh: string;
        twinZh: string;
        balanceZh: string;
        scooterZh: string;
        carSeatZh: string;
        defaultZh: string;
        travelEn: string;
        travelSystemEn: string;
        joggerEn: string;
        twinEn: string;
        balanceEn: string;
        scooterEn: string;
        carSeatEn: string;
        defaultEn: string;
      };
      capacity: {
        formattedZh: string;
        formattedEn: string;
        defaults: {
          wagonDouble: { value: string; duty: string };
          stroller: { value: string; duty: string };
          bike: { value: string; duty: string };
          fallback: { value: string; duty: string };
        };
      };
      auditLabels: {
        sideImpactZh: string;
        sideImpactEn: string;
        allTerrainStableZh: string;
        allTerrainStableEn: string;
        allTerrainSafeZh: string;
        allTerrainSafeEn: string;
        lowCogZh: string;
        lowCogEn: string;
      };
      logicTokens: {
        keywordPresence: {
          kidsBike: string;
          balanceBike: string;
          twinStroller: string;
          electricScooter: string;
        };
        categorySignals: {
          stroller: string[];
          balance: string[];
          bike: string[];
          bicycle: string[];
          wagonOrDouble: string[];
          carSeatOrSafetySeat: string[];
          scooter: string[];
        };
        electricSignals: string[];
        twinSignals: string[];
        travelSignals: string[];
        heavySignals: string[];
        balanceSignals: string[];
        generatedSummarySignals: {
          travel: string[];
          travelSystem: string[];
          jogger: string[];
          twin: string[];
          balance: string[];
          scooter: string[];
          carSeat: string[];
        };
        auditSignals: {
          suspension: string[];
        };
      };
    };
  };
  reviews: {
    breadcrumb: string;
    badge: string;
    heroTitle: string;
    heroDescription: string;
    smartFinderTitle: string;
    smartFinderDescription: string;
    smartFinderCta: string;
    sections: {
      strollerTitle: string;
      strollerDesc: string;
      bikeTitle: string;
      bikeDesc: string;
      balanceTitle: string;
      balanceDesc: string;
      scooterTitle: string;
      scooterDesc: string;
      electricTitle: string;
      electricDesc: string;
      noElectricData: string;
    };
    cta: {
      stroller: string;
      bike: string;
      balance: string;
      scooter: string;
      product: string;
    };
    standardsTitle: string;
    standardsSubtitle: string;
    standardsDesc: string;
    radarAriaLabel: string;
    reviewTypes: {
      single: string;
      compare: string;
      value: string;
      ranking: string;
      safety: string;
    };
    reportBadges: {
      report: string;
      comparison: string;
      valuePick: string;
      topRanking: string;
      safetySpecs: string;
      expertReport: string;
    };
    detailTitleSuffix: string;
    summaryTitle: string;
    prosTitle: string;
    consTitle: string;
    keywordPills: {
      travelStroller: string;
      joggingStroller: string;
      balanceBike: string;
      kidsBike: string;
      kidsScooter: string;
      kidsElectricCar: string;
    };
    businessCopy: {
      fallbackBrandZh: string;
      verdictTemplates: {
        strollerZh: string;
        balanceZh: string;
        bikeZh: string;
        defaultZh: string;
        strollerEn: string;
        balanceEn: string;
        bikeEn: string;
        defaultEn: string;
      };
      dynamicCta: {
        strollerZh: string;
        balanceZh: string;
        scooterZh: string;
        bikeZh: string;
        defaultZh: string;
        strollerEn: string;
        balanceEn: string;
        scooterEn: string;
        bikeEn: string;
        defaultEn: string;
      };
      logicTokens: {
        verdictCategorySignals: {
          stroller: string[];
          balance: string[];
          bikeOrBicycle: string[];
        };
        ctaSignals: {
          stroller: string[];
          balance: string[];
          scooter: string[];
          bikeOrBicycle: string[];
        };
        focusSignals: {
          exclude: string[];
          include: string[];
        };
        categoryBucketSignals: {
          stroller: string[];
          strollerExclude: string[];
          balance: string[];
          scooter: string[];
          bikeExact: string[];
          bikeExclude: string[];
        };
        commercialSeedSignals: {
          travel: string[];
          jogger: string[];
          chiccoBravo: string[];
        };
        floorSignals: {
          strollerLike: string[];
          balanceLike: string[];
          bikeLike: string[];
          bikeExclude: string[];
          scooterLike: string[];
          travel: string[];
          jogging: string[];
          electricCarLike: string[];
        };
      };
    };
  };
  news: {
    breadcrumbGlobal: string;
    detailBack: string;
    detailSummary: string;
    detailReadPrefix: string;
    detailViewsPrefix: string;
    guidesTitle: string;
    guideBadge: string;
    guideRead: string;
    closeReading: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    categoryTabs: {
      all: string;
      newProduct: string;
      science: string;
      brandNews: string;
      industry: string;
    };
    noMatches: string;
    latestTitle: string;
    latestDesc: string;
    readMore: string;
    globalNewsSeoName: string;
    fallbackSummary: string;
    fallbackContent: string;
    fallbackAuthor: string;
    fallbackReadTime: string;
    likeAria: string;
    shareAria: string;
    prevPageAria: string;
    nextPageAria: string;
  };
  about: {
    breadcrumb: string;
    heroBadge: string;
    heroTitle: string;
    heroDesc: string;
    partnershipTitle: string;
    partnershipDesc: string;
    contactCta: string;
  };
};

const PAGE_COPY: Record<Locale, PageCopy> = {
  zh: {
    home: {
      overviewLabel: "首页概览",
      bannerBadge: "BBT 官方安全审计",
      heroTitle: "欢迎来到 BalanceBikeToddler，我们为儿童轮式出行装备提供值得信赖的全球评测数据。",
      heroSubtitle: "平衡车、儿童自行车、滑板车、推车&慢跑手推车与儿童电动车精选,经过独立实验室物理安全检测的科学测评数据整合模型。",
      heroCta: "3 步找到最适合孩子的出行方案",
      quickCategories: {
        kidsBike: "儿童自行车",
        balanceBike: "平衡车",
        kidsScooter: "儿童滑板车",
        joggingStroller: "慢跑手推车",
      },
      categoryHighlights: {
        eyebrow: "精选品类",
        title: "按品类探索：找到最适合孩子的出行装备",
        description: "我们围绕婴儿推车与儿童自行车，对车架人体工学与结构耐受表现进行对比评估。",
        openProductCenter: "进入产品中心",
        featuredTag: "精选",
      },
      categoryCards: {
        strollerLabel: "慢跑手推车",
        strollerDesc: "发现我们评分领先的慢跑手推车，经过全地形悬挂、安全刹车及宝宝舒适度的严格实验室测试。",
        balanceLabel: "儿童平衡车",
        balanceDesc: "为您的儿童寻找最安全的平衡车。我们评估车架重量、轮胎抓地力和人体工学，帮助他们自信骑行。",
        kidsBikeLabel: "儿童自行车",
        kidsBikeDesc: "比较最优秀的 12 英寸至 16 英寸儿童自行车。我们的中立评测聚焦于制动力学、车架几何与脚踏稳定性。",
        scooterLabel: "儿童滑板车",
        scooterDesc: "探索我们经专业评测的儿童滑板车系列。从稳定的三轮车到灵敏的两轮车，我们测试踏板强度和转向安全设计。",
        electricCarLabel: "四轮儿童电动车",
        electricCarDesc: "评测领先的电池驱动儿童玩具车。我们对机电机理、遥控保护与减震安全性等指标进行专项验证。",
        carSeatLabel: "儿童安全座椅",
        carSeatDesc: "全面深度评测儿童汽车安全座椅。我们聚焦于抗侧撞缓冲吸能、防位移五点式束带系统与卡扣牢固度指标。",
      },
      safetyAudits: {
        badge: "安全专项检测",
        title: "安全审计：购买前务必双重核验",
        description: "下方每一款儿童自行车、平衡车与儿童滑板车，均已通过高冲击应力评测与安全阈值评级。",
        viewAudits: "查看安全评测报告",
        morePicks: "更多精选推荐",
        noElectricData: "暂无电动车评测数据，敬请期待",
        sections: {
          joggingTitle: "最佳慢跑手推车",
          joggingDesc: "精选高安全性能慢跑手推车，深度测评全地形悬挂避震与车胎稳定性设计。",
          balanceTitle: "最佳平衡车",
          balanceDesc: "专为幼童打造的滑行平衡车测评，聚焦轮胎防滑、防侧翻限位及脚踏高度配置。",
          kidsBikeTitle: "最佳儿童自行车",
          kidsBikeDesc: "精选 12-16 英寸高安全评分儿童自行车，严苛测试制动距离与车架刚度。",
          scooterTitle: "最佳儿童滑板车",
          scooterDesc: "针对幼童与大童的防翻侧滑板车评测，重点聚焦重力转向及防空转安全垫片。",
          electricCarTitle: "最佳儿童电动车",
          electricCarDesc: "全方位儿童电动遥控模拟舱测试，着重实测双向避震、缓启冲阻性及电池管理系统。",
        },
      },
      quickScenarios: {
        title: "智能选购场景",
        description: "从成长阶段出发，为您快速匹配最佳方案。",
        cards: {
          newbornLabel: "新生儿(0-12月) · 出行安全",
          newbornDesc: "侧重减震与中轴枢纽强度",
          outdoorLabel: "户外郊游 · 越野专家",
          outdoorDesc: "轮组抓地力与通过性专项评测",
          commuteLabel: "日常通勤 · 轻便首选",
          commuteDesc: "折叠速度与整备质量极限对比",
        },
      },
      faq: {
        badge: "常见问题",
        title: "常见问题与解答",
        description: "为您解答关于慢跑手推车、平衡车与儿童自行车测试标准的常见问题。",
        items: [
          {
            question: "BalanceBikeToddler 如何评估慢跑手推车在全地形高速运动下的避震与制动安全性？",
            answer: "我们在测试慢跑手推车时，会重点检测三个指标：一是前两圈的追踪定位与转向锁定机构（高速慢跑时必须锁定前轮以防剧烈抖动颠覆）；二是充气大橡胶轮胎与高性能避震弹簧在5厘米障碍路面上的重力加速度传导（G-Force必须限制在1.0G以内）；三是手刹与后轮双踩锁死制动的响应时间与减速率控制。",
          },
          {
            question: "如何为不同年龄的幼童精准选配儿童自行车以及规避不安全的刹车系统？",
            answer: "初学者鞍座高度应比脱鞋腿部跨高（Inseam）低2.5厘米以确保双脚平足全落地。在制动系统上，BalanceBikeToddler强烈反对低端童车配备的倒踩脚刹（Coaster Brakes），此类刹车缺乏线性无极阻尼极易打滑、在紧急时刻还会锁死曲柄使车辆失控侧倾。应优选专门针对儿童手掌骨化周期定制、握距≤42mm的双手短行程闸把系统。",
          },
          {
            question: "三轮滑板车的重力倾斜转向系统真的比普通的双轮滑板车更安全吗？",
            answer: "是的。三轮滑板车采用的重力倾斜转向（Lean-To-Steer）不仅可以防止幼童在高速转向时发生骤急侧翻或甩飞，还能积极训练孩子脑部前庭系统的本体平衡感知。对于3岁以下刚入门的学龄前儿童，宽大低矮的踏板设计与超平稳的三角形分布三轮滑板车是安全性极高的首选，而两轮滑板车则适合平衡能力完备的学龄大童。",
          },
          {
            question: "如何检测四轮电动童车的动力源安全性、限速保护与抗倾覆防摔稳定指标？",
            answer: "四轮玩具电动车的检测首重电池包的安全散热与防短路热熔断保护，规避大电流充放电自燃与电解液泄漏。其次，车辆的最高物理时速必须严格被限制在3至8公里/小时以内，且母体控制端必须配备绝对优先权的父母遥控器（一键刹停、无极变频）。此外，四轮距物理宽度与高重心重心的倾斜倾翻系数也是我们的重点审计数据。",
          },
          {
            question: "劣质、不合规的童车和童车结构，容易对正在快速发育的儿童骨骼与前庭系统造成哪些慢性损伤？",
            answer: "低价劣质童车为节省开模费用，常粗暴套用成人五通中轴总成。偏宽的 Q-Factor（脚踏左右偏距宽度）会强行拉开儿童大腿骨，踩踏时膝关节被迫向内侧严重扣折（形成内八或X型腿趋势），导致髌骨关节面在发育初期的软骨阶段发生不可逆磨损。此外，实心发泡轮胎（EVA）由于没有任何物理空气微孔弹性吸收，产生的3.8G以上高频振荡波会直击大脑、前庭及未发育成熟的椎骨骨骺，干扰神经感知并阻碍发育。",
          },
        ],
      },
      runtimeLabels: {
        categoryNames: {
          joggingStroller: "慢跑手推车",
          balanceBike: "平衡车",
          kidsBike: "儿童自行车",
          kidsElectricCar: "儿童电动车",
          kidsScooter: "儿童滑板车",
          stroller: "婴儿推车",
          featuredProduct: "精选产品",
        },
        evaluating: "评测中",
        fallbackActive: "已回退占位图",
        jsonLdHomeName: "BalanceBikeToddler 首页",
      },
    },
    products: {
      breadcrumbsProducts: "产品列表",
      heroTitle: "专家产品中心：儿童自行车、双胞胎双人推车及儿童电动车",
      heroSubtitle: "经过独立实验室物理安全检测的儿童自行车、平衡车、双胞胎双人手推车及儿童电动滑板车的科学测评数据整合模型。",
      searchLabel: "搜索童车和婴儿推车",
      searchPlaceholder: "搜寻型号",
      sortLabel: "排序条件规划",
      sortAria: "排序产品",
      sortOptions: {
        topRated: "🏆 专家综合推荐",
        lightweight: "⚖️ 极轻量优先",
        luxuryFirst: "💰 顶级奢选",
        bestValue: "💎 卓越性价比",
      },
      categoriesLabel: "核心品类精选",
      ageLabel: "适龄跨度",
      ageOptions: { all: "全部", baby: "婴儿", toddler: "小童", child: "中大童" },
      priceLabel: "预算区间",
      priceOptions: { all: "全部", budget: "大众", mid: "中端", premium: "极致" },
      noMatches: "全球数据库中暂无特定匹配项",
      resetFilters: "清空全部过滤条件",
      expertPicks: "专家产品精选",
      metricsHint: "📊 物理实测：🧪 实验室综合评分 | 📦 承重性能参数 | 🛡️ 全球体系安全准入合规验证",
      allProductsLabel: "📁 全部产品",
      filterFacets: {
        brandLabel: "品牌",
        selectBrand: "选择品牌",
        frameLabel: "车架材质",
        selectFrame: "选择车架材质",
        tireLabel: "轮胎类型",
        selectTire: "选择轮胎类型",
        brakeLabel: "制动系统",
        selectBrake: "选择制动系统",
        wheelCountLabel: "轮子个数",
        selectWheelCount: "选择轮子个数",
        wheelLabel: "轮径",
        selectWheel: "选择轮径",
        certificationLabel: "安全认证",
        selectCertification: "选择安全认证",
        allOption: "全部",
      },
      topBadge: "★ 官方童车安全基线数据库",
      seoPills: {
        balanceBikeToddler: "儿童平衡车",
        twinStroller: "双人婴儿推车",
        toddlerBike: "儿童脚踏自行车",
        kidsElectricScooter: "儿童电动滑板车",
      },
      compareLimitTip: "【对比上限提醒】最多只能同时对比 4 款，请先在下方移除一个。",
      saveTips: {
        loginRequired: "请先注册/登录后收藏产品。",
        removed: "已从收藏列表移除。",
        saved: "已收藏，可在会员中心查看。",
      },
      productCard: {
        viewMetricsAriaPrefix: "查看",
        scoreTitle: "综合评分",
        capacityTitle: "承载重量",
        adminEditTitle: "后台编辑",
        adminEditLabel: "后台编辑",
        compareAria: "加入对比",
        saveAria: "收藏产品",
      },
      pagination: {
        prevPageAria: "上一页",
        nextPageAria: "下一页",
        pageAriaPrefix: "第",
        pageAriaTemplate: "第 {current} 页，共 {total} 页",
      },
      history: {
        title: "最近浏览车款",
        subtitle: "您最近查看过的物理测试细节档案（保存在浏览器中）",
      },
      businessCopy: {
        descriptionTemplates: {
          kidsBikeZh: "这款专为幼童研发的专业儿童自行车采用高强度车架及科学防摔重心设计。 {base}",
          kidsBikeEn: "This highly certified toddler bike features premium structural geometry and superb braking safety. {base}",
          balanceBikeZh: "这台专业婴儿平衡车旨在安全锻炼儿童本体前庭系统和手腿协调力。 {base}",
          balanceBikeEn: "This ergonomic balance bike toddler leverages ultra-lightweight alloys for the ultimate safe learning experience. {base}",
          twinStrollerZh: "这款顶级双胞胎双人婴儿车的五点式防护设计和全地形减震系统给予两个宝宝全方位的舒适与放心。 {base}",
          twinStrollerEn: "This high-performance double twin stroller incorporates state-of-the-art shock absorption and premium responsive seating for families with multiples. {base}",
          electricScooterZh: "作为一款专业且安全的儿童电动滑板车，它配备了母体优先遥控制动及安全限速熔断。 {base}",
          electricScooterEn: "Engineered as an award-winning kids electric scooter, this model ensures optimal velocity limits and dynamic brake responsiveness. {base}",
        },
        generatedSummary: {
          travelZh: "适合出行场景的轻便旅行推车，强调紧凑收纳、机场携带与日常快速折叠。",
          travelSystemZh: "旅行系统套装，兼顾婴儿安全座椅衔接、家庭通勤与新生儿出行便利性。",
          joggerZh: "面向户外慢跑和公园路面的三轮推车，重点关注稳定性、轮组通过性与推行控制。",
          twinZh: "双座推车方案，适合双胞胎或二孩家庭，重点关注座舱空间与转向稳定性。",
          balanceZh: "儿童平衡车入门选择，帮助建立低速控车、转向协调与初期骑行信心。",
          scooterZh: "儿童滑板车方案，适合短途玩耍与平衡训练，重点关注转向反馈和低龄稳定性。",
          carSeatZh: "儿童安全座椅选择，重点关注安装兼容性、侧向防护与日常乘车安全。",
          defaultZh: "基于品类参数与家庭使用场景整理的候选产品，适合进一步比较重量、价格与安全配置。",
          travelEn: "Compact travel stroller for airport trips, fold-friendly storage, and everyday lightweight handling.",
          travelSystemEn: "Travel system bundle pairing stroller mobility with infant car seat compatibility for daily family trips.",
          joggerEn: "Jogging stroller option for park paths and active families, focused on stability, wheel control, and smoother pushing.",
          twinEn: "Twin stroller pick for twins or two-child families, balancing cabin space, steering stability, and shared outings.",
          balanceEn: "Toddler balance bike focused on early confidence, low-speed control, and first-ride coordination.",
          scooterEn: "Kids scooter option for short rides and balance practice, with emphasis on steering feedback and beginner stability.",
          carSeatEn: "Child car seat option focused on installation fit, side-impact protection, and everyday passenger safety.",
          defaultEn: "Curated product candidate for comparing weight, price, safety configuration, and family-use fit.",
        },
        capacity: {
          formattedZh: "{value} 磅 ({duty})",
          formattedEn: "{value}# ({duty})",
          defaults: {
            wagonDouble: { value: "150", duty: "H" },
            stroller: { value: "50", duty: "S" },
            bike: { value: "110", duty: "H" },
            fallback: { value: "150", duty: "H" },
          },
        },
        auditLabels: {
          sideImpactZh: "侧向防护结构认证",
          sideImpactEn: "SideImpact",
          allTerrainStableZh: "全地形避震稳定",
          allTerrainStableEn: "AllTerrain",
          allTerrainSafeZh: "全地形安全避震",
          allTerrainSafeEn: "AllTerrain",
          lowCogZh: "低重心控车安全",
          lowCogEn: "LowCOG",
        },
        logicTokens: {
          keywordPresence: {
            kidsBike: "toddler bike",
            balanceBike: "balance bike toddler",
            twinStroller: "double twin stroller",
            electricScooter: "kids electric scooter",
          },
          categorySignals: {
            stroller: ["stroller"],
            balance: ["balance"],
            bike: ["bike"],
            bicycle: ["bicycle"],
            wagonOrDouble: ["wagon", "double"],
            carSeatOrSafetySeat: ["car_seat", "safety_seat"],
            scooter: ["scooter"],
          },
          electricSignals: ["electric", "motorized", "battery", "e-scooter", "e-bike", "mx350"],
          twinSignals: ["twin", "double", "sibling", "double twin stroller", "twin stroller", "双人"],
          travelSignals: ["travel stroller", "lightweight stroller", "umbrella stroller", "compact stroller", "cabin", "portable", "travel", "lightweight", "umbrella", "轻便", "旅行", "便携"],
          heavySignals: ["jogger", "jogging", "double twin stroller", "double", "twin stroller", "twin", "双人", "慢跑"],
          balanceSignals: ["balance bike", "平衡车"],
          generatedSummarySignals: {
            travel: ["airplane", "airline", "compact", "travel"],
            travelSystem: ["car seat", "travel system", "infant"],
            jogger: ["jogger", "jogging", "runner"],
            twin: ["double", "twin"],
            balance: ["balance"],
            scooter: ["scooter"],
            carSeat: ["car seat"],
          },
          auditSignals: {
            suspension: ["suspension", "all-terrain", "shock"],
          },
        },
      },
    },
    reviews: {
      breadcrumb: "评测中心",
      badge: "★ 独立实验室测试与评测",
      heroTitle: "儿童自行车，推车，滑板车，电动汽车独立评测中心",
      heroDescription: "帮您更简单、更放心地挑选最适合宝宝的优质座驾。无论是轻便折叠推车、避震越野慢跑手推车，还是平衡车与儿童脚踏自行车，我们都坚持 100% 中立客观的自购样品检验，为您呈现深度评测。",
      smartFinderTitle: "不确定哪款车最适合您的宝宝？",
      smartFinderDescription: "使用我们极具人气的智能匹配向导，一秒计算最适合您宝宝年龄与身高跨高范围的定制参数！",
      smartFinderCta: "测一测我的最佳推荐 ➔",
      sections: {
        strollerTitle: "高端出行：婴儿推车深度评测",
        strollerDesc: "一站式获取最新手推车横向物理测评，保障宝宝出行舒适健康。",
        bikeTitle: "经典踩踏：儿童脚踏自行车深度评测",
        bikeDesc: "大童脚踏车精品测试：JOYSTAR、Cubsala-BMX 与 Glerc 等型号。",
        balanceTitle: "儿童学跑：平衡车深度评测",
        balanceDesc: "首推幼童学跑单品：SEREED、Gamfeiny 与 Umatoll 等低重心起步测评。",
        scooterTitle: "极速滑行：儿童滑板车深度评测",
        scooterDesc: "三轮重力转向摇摆及两轮滑板车评测：Gotrax、HopCycle 系列款。",
        electricTitle: "仿真驾驶：儿童电动车深度评测",
        electricDesc: "越野电动车、仿真赛车多轨测试：防护起步加速度与绝缘回路安全性。",
        noElectricData: "暂无电动玩具车专项测评。",
      },
      cta: {
        stroller: "查看推车深度安全评测报告 ➔",
        bike: "查看自行车深度评测 ➔",
        balance: "查看平衡车学术评测 ➔",
        scooter: "查看滑板车深度性能报告 ➔",
        product: "查看完整产品评测 ➔",
      },
      standardsTitle: "测试方法论与客观性誓言",
      standardsSubtitle: "BalanceBikeToddler LAB STANDARDS",
      standardsDesc: "BalanceBikeToddler 物理安全验证完全遵守各项核心权威儿童辅具出厂与行使指标。我们坚持零赞助协议，样品直接进入滚筒颠簸疲劳机实测，不接受商业推广影响结果。",
      radarAriaLabel: "评分雷达图",
      reviewTypes: {
        single: "🔬 单品实测",
        compare: "⚖️ 多品横评",
        value: "🚲 平衡车评测",
        ranking: "🏆 榜单汇编",
        safety: "🛡️ 安全专项",
      },
      reportBadges: {
        report: "报告",
        comparison: "多品横评",
        valuePick: "性价比之选",
        topRanking: "年度排行",
        safetySpecs: "安全专项测试",
        expertReport: "深度专家报告",
      },
      detailTitleSuffix: "深度安全评测报告",
      summaryTitle: "评测室综合洞察",
      prosTitle: "优点",
      consTitle: "不足",
      keywordPills: {
        travelStroller: "轻便推车",
        joggingStroller: "慢跑手推车",
        balanceBike: "平衡车",
        kidsBike: "儿童自行车",
        kidsScooter: "儿童滑板车",
        kidsElectricCar: "儿童电动车",
      },
      businessCopy: {
        fallbackBrandZh: "该高端型号",
        verdictTemplates: {
          strollerZh: "【实验室评测】{brand} {modelName} 拥有极佳的抗震力学构造与顺畅微操。总体实测得分 {rating}，能给予宝宝全天候的前庭保护。",
          balanceZh: "【实验室评测】{brand} 儿童平衡车在安全转弯限位与重心分布上表现极为优秀。总体得分 {rating}，非常有利于宝宝四肢骨骼和平衡觉早期发育。",
          bikeZh: "【实验室评测】{brand} 双手刹儿童自行车重量适中、制动力线性安全。物理拆解评分 {rating}，保障宝宝的安全骑行。",
          defaultZh: "【实验室评测】{brand} 车辆安全框架厚实，在震荡抗疲劳稳定性物理实验中表现优异。总体实测评级达 {rating} 分，非常高分可靠。",
          strollerEn: "[Lab Report] The {cleanBrand} stroller stands out for highly responsive handling and airplane-friendly folding geometry. Scoring {rating} overall, its multi-terrain suspension is ideal for active parents seeking travel strollers.",
          balanceEn: "[Lab Report] Engineering a lightweight solid frame, the {cleanBrand} balance bike ensures stable low-COG ride control and safety steering. Earning a {rating} overall mark, it is perfect for early balance skills training.",
          bikeEn: "[Lab Report] Earning a robust {rating} safety rating, this {cleanBrand} kids bicycle features highly consistent brakes and dynamic pedal support, serving as a dependable choice for young riders.",
          defaultEn: "[Lab Report] Rigorously validated for framework stiffness, tire grip, and weight capacity, this {cleanBrand} model secures an outstanding {rating} overall score under simulated road test conditions.",
        },
        dynamicCta: {
          strollerZh: "阅读婴儿车深度审计报告 ➔",
          balanceZh: "阅读平衡车学步专项测议 ➔",
          scooterZh: "阅读滑板车安全性能报告 ➔",
          bikeZh: "阅读儿童自行车力学测评 ➔",
          defaultZh: "阅读完整产品测评报告 ➔",
          strollerEn: "Stroller Review ➔",
          balanceEn: "Balance Ride Report ➔",
          scooterEn: "Kids Scooter Review ➔",
          bikeEn: "Toddler Bike Audit ➔",
          defaultEn: "Product Review ➔",
        },
        logicTokens: {
          verdictCategorySignals: {
            stroller: ["stroller"],
            balance: ["balance"],
            bikeOrBicycle: ["bike", "bicycle"],
          },
          ctaSignals: {
            stroller: ["stroller", "jogger", "travel"],
            balance: ["balance"],
            scooter: ["scooter"],
            bikeOrBicycle: ["bike", "bicycle"],
          },
          focusSignals: {
            exclude: ["dirt bike", "dirtbike", "motocross", "motorcycle"],
            include: ["stroller", "balance", "bicycle", "bike", "scooter", "off-road", "off road"],
          },
          categoryBucketSignals: {
            stroller: ["stroller", "jogger"],
            strollerExclude: ["car_seat"],
            balance: ["balance"],
            scooter: ["scooter"],
            bikeExact: ["kids_bikes", "bicycle"],
            bikeExclude: ["balance", "tricycle", "scooter"],
          },
          commercialSeedSignals: {
            travel: ["yoyo", "travel stroller", "coast rider", "mompush"],
            jogger: ["bob gear", "jogging stroller", "jogger"],
            chiccoBravo: ["chicco", "bravo"],
          },
          floorSignals: {
            strollerLike: ["stroller", "wagon", "jogger"],
            balanceLike: ["balance"],
            bikeLike: ["bike", "bicycle", "kids_bikes"],
            bikeExclude: ["balance"],
            scooterLike: ["scooter"],
            travel: ["travel", "butterfly", "lightweight", "compact"],
            jogging: ["jogger", "jogging", "gt2", "expedition"],
            electricCarLike: ["electric", "car", "vehicle"],
          },
        },
      },
    },
    news: {
      breadcrumbGlobal: "全球资讯",
      detailBack: "返回资讯目录",
      detailSummary: "摘要：",
      detailReadPrefix: "阅读约",
      detailViewsPrefix: "累计浏览",
      guidesTitle: "出行实验室：推荐选购安全指南",
      guideBadge: "实验室首选大奖",
      guideRead: "阅读导购指南",
      closeReading: "关闭阅读",
      heroBadge: "全球出行安全情报所",
      heroTitle: "全球童车动态：儿童电单车与电动滑板车资讯观察",
      heroSubtitle: "深度追踪全球童车及推车（越野电动童车、轻量化滑步车、多档悬挂阻尼车架、折叠电动滑板车及儿童推车）行业标准，权威输出基于源头制造供应链的硬核品质指南。",
      categoryTabs: {
        all: "📰 全部文章",
        newProduct: "🆕 新品发布",
        science: "🧪 科普干货",
        brandNews: "🏷️ 品牌故事",
        industry: "📊 行业趋势",
      },
      noMatches: "没找到相关的资讯文章",
      latestTitle: "最新童车资讯与行业动态",
      latestDesc: "按行业趋势、新品发布与法规政策持续追踪真实市场变化。",
      readMore: "阅读原文 →",
      globalNewsSeoName: "全球童车资讯库",
      fallbackSummary: "BalanceBikeToddler 行业动态与科普报告。",
      fallbackContent: "中文内容整理中，请稍后查看。",
      fallbackAuthor: "BalanceBikeToddler 全球安全实验室",
      fallbackReadTime: "5 分钟",
      likeAria: "点赞文章",
      shareAria: "分享文章",
      prevPageAria: "上一页",
      nextPageAria: "下一页",
    },
    about: {
      breadcrumb: "关于我们",
      heroBadge: "ESTABLISHED IN 2026 · 独立第三方权威安全实验室",
      heroTitle: "BalanceBikeToddler：您信赖的中立儿童出行安全实验室",
      heroDesc: "我们100%对标全球最严苛的儿童健康力学测试体系，通过不平整颠震传导、手闸阻力、Q-Factor 膝跨跨距以及钢架结构疲劳抗压等精密实验仪，深度拆解婴儿推车、平衡滑步车、儿童自行车及滑板车的潜在设计缺陷，用独立硬核实测数据捍卫宝宝的骨骼安全与健康成长。",
      partnershipTitle: "评测合作与媒体联动",
      partnershipDesc: "我们欢迎任何以“守护儿童骑行安全”为前提的共建合作。包括实验室认证互认、行业报告联合发布以及媒体专项评测。",
      contactCta: "联系我们",
    },
  },
  en: {
    home: {
      overviewLabel: "OVERVIEW",
      bannerBadge: "OFFICIAL BBT SAFETY AUDIT",
      heroTitle: "BalanceBikeToddler your trusted global review site for kids bike & stroller wheeled toys.",
      heroSubtitle: "The best balance bike, kids bike, kids scooter, stroller & electric car, independently tested for safety and performance.",
      heroCta: "FIND YOUR PERFECT RIDE IN 3 STEPS",
      quickCategories: {
        kidsBike: "KIDS BIKE",
        balanceBike: "BALANCE BIKE",
        kidsScooter: "KIDS SCOOTER",
        joggingStroller: "JOGGING STROLLER",
      },
      categoryHighlights: {
        eyebrow: "Category Highlights",
        title: "Explore by Category: Find Your Perfect Kids' Mobility",
        description: "We compare frame ergonomics and stress tolerances across stroller and kids bike parameters.",
        openProductCenter: "Open Product Center",
        featuredTag: "Featured",
      },
      categoryCards: {
        strollerLabel: "Jogging Stroller",
        strollerDesc: "Discover our top-rated jogging stroller picks, rigorously lab-tested for all-terrain suspension, secure braking, and ultimate child comfort during your runs.",
        balanceLabel: "Balance Bike",
        balanceDesc: "Find the safest balance bike for your toddler. We evaluate frame weight, tire grip, and ergonomics to help them learn to ride with confidence.",
        kidsBikeLabel: "Kids Bike",
        kidsBikeDesc: "Compare the best 12-inch to 16-inch kids bike models. Our unbiased reviews focus on braking power, structural geometry, and pedal stability.",
        scooterLabel: "Kids Scooter",
        scooterDesc: "Explore our expertly reviewed kids scooter selection. From stable 3-wheelers to agile 2-wheelers, we test for deck strength and steering safety.",
        electricCarLabel: "Kids Electric Car",
        electricCarDesc: "Browse premium battery-powered kids' ride-on vehicles. We test motor limit safety, speed controls, remote limits, and structural stiffness.",
        carSeatLabel: "Kids Car Seat",
        carSeatDesc: "Explore high-protection infant and kids car seats. We evaluate impact shock absorption, 5-point harness safety, and secure installation.",
      },
      safetyAudits: {
        badge: "Safety Audits Hub",
        title: "Safety Audits: Double-check Before Purchasing",
        description: "Every kids bike, balance bike and kids scooter below has passed high-impact stress reviews and safety threshold ratings.",
        viewAudits: "View Safety Audits",
        morePicks: "More Picks",
        noElectricData: "No electric car evaluation data available yet.",
        sections: {
          joggingTitle: "Best Jogging Stroller",
          joggingDesc: "Discover the safest high-performance jogging strollers, meticulously evaluated for all-terrain shock absorption and stability.",
          balanceTitle: "Best Balance Bike",
          balanceDesc: "Safest toddler-friendly balance bikes. We test handle grips, turning limiters, and frame weights.",
          kidsBikeTitle: "Best Kids Bike",
          kidsBikeDesc: "Curated 12-16 inch kids bike models. Rigorously tested for pedal stability, frame geometry and stopping power.",
          scooterTitle: "Best Kids Scooter",
          scooterDesc: "Robust safety evaluations on stability and lean-to-steer mechanisms. We audit deck strength and steering response.",
          electricCarTitle: "Best Kids Electric Car",
          electricCarDesc: "Comprehensive evaluations on interactive dual-drive simulation cabins. We audit suspension, smooth start control, and battery cell reliability.",
        },
      },
      quickScenarios: {
        title: "Quick Selection Scenarios",
        description: "Find the perfect match based on your child's growth stage.",
        cards: {
          newbornLabel: "Newborn Mobility",
          newbornDesc: "Focus on shock absorption",
          outdoorLabel: "Outdoor Experts",
          outdoorDesc: "Grip and terrain testing",
          commuteLabel: "Daily Commute",
          commuteDesc: "Weight and folding speed",
        },
      },
      faq: {
        badge: "FAQ",
        title: "Frequently Asked Questions",
        description: "Answering your questions on kids mobility testing standards and safe selection guidelines.",
        items: [
          {
            question: "How does BalanceBikeToddler test jogging strollers for all-terrain high-speed suspension and braking safety?",
            answer: "We focus on three critical specs when testing jogging strollers: first, the front wheel tracking lock (essential to prevent speed wobbles during high-speed runs); second, G-force telemetry across 5cm obstacles (ensuring vibration stays below 1.0G on pneumatic rubber tires); third, hand-activated deceleration brakes coupled with reliable parking locks for immediate incline arrests.",
          },
          {
            question: "How to select the right kids bike and avoid hazardous bicycle braking systems?",
            answer: "Standfoot crotch inseam is the gold standard for sizing. For beginners, the minimum saddle height should be 2.5cm below their inseam for flat-foot stability. Regarding brakes, BalanceBikeToddler strongly discourages pedal-back Coaster Brakes due to lack of modulation and launch-angle lockups; choose specialized kids' hand levers with a short grip-reach of 42mm or less.",
          },
          {
            question: "Are 3-wheel lean-to-steer kids scooters significantly safer than traditional 2-wheelers for toddlers?",
            answer: "Yes. The lean-to-steer mechanism on 3-wheel scooters provides superior lateral stability, preventing high-speed high-side flips while developing early vestibular balance in toddlers. For children under 3 years old, wide-deck, low-center-of-gravity 3-wheelers are overwhelmingly safer, while agile 2-wheel models are reserved for older kids with established balancing skills.",
          },
          {
            question: "How does BalanceBikeToddler evaluate battery safety, remote overrides, and roll stability for 4-wheel kids electric cars?",
            answer: "Testing electric ride-ons centers first on battery pack safety (overcharge and short-circuit thermal fuses to completely prevent fire hazards). Second, velocity bounds must be constrained between 3 to 8 km/h, backed by a 2.4G parental override remote that preempts toddler inputs instantly. Lastly, a wide-track chassis geometry is audited to prevent tipping during tight maneuvers.",
          },
          {
            question: "How do low-quality children's bikes and ride-ons cause permanent skeletal and joint strain for a growing child?",
            answer: "Low-quality ride-ons often repurpose adult components, introducing dangerous mismatches. For example, excessive Q-Factors (wide pedal stance) force pediatric joints into inward-bowing (genu valgum) tracks, risking permanent cartilage wear. Additionally, solid EVA foam wheels lack pneumatic cushioning, delivering sharp 3.8G shockwaves directly up to a toddler's unossified spine and delicate inner-ear structures.",
          },
        ],
      },
      runtimeLabels: {
        categoryNames: {
          joggingStroller: "Jogging Stroller",
          balanceBike: "Balance Bike",
          kidsBike: "Kids Bike",
          kidsElectricCar: "Kids Electric Car",
          kidsScooter: "Kids Scooter",
          stroller: "Stroller",
          featuredProduct: "Featured Product",
        },
        evaluating: "Evaluating",
        fallbackActive: "Fallback active",
        jsonLdHomeName: "BalanceBikeToddler Home",
      },
    },
    products: {
      breadcrumbsProducts: "PRODUCTS",
      heroTitle: "Expert Product Hub: All Kids' Bikes, Strollers & Kids Ride-On Toys",
      heroSubtitle: "Independent lab-tested evaluations for toddler bike, balance bike, twin stroller, and electric ride-on toys evaluated for safety, durability, and fun.",
      searchLabel: "Search Products",
      searchPlaceholder: "SEARCH PRODUCTS",
      sortLabel: "SORT ORDER",
      sortAria: "Sort products",
      sortOptions: {
        topRated: "🏆 TOP RATED",
        lightweight: "⚖️ LIGHTWEIGHT",
        luxuryFirst: "💰 LUXURY FIRST",
        bestValue: "💎 BEST VALUE",
      },
      categoriesLabel: "Categories",
      ageLabel: "Age Bridge",
      ageOptions: { all: "ALL", baby: "0-2 Y", toddler: "2-5 Y", child: "5+ Y" },
      priceLabel: "Price Filter",
      priceOptions: { all: "ALL", budget: "BUDGET", mid: "MID", premium: "PREMIUM" },
      noMatches: "No matches in global database",
      resetFilters: "Reset All Filters",
      expertPicks: "Expert Product Picks",
      metricsHint: "📊 Metrics index: 🧪 Score | 📦 Capacity limits | 🛡️ Compliance certified",
      allProductsLabel: "📁 All Products",
      filterFacets: {
        brandLabel: "Brand",
        selectBrand: "Select brand",
        frameLabel: "Frame",
        selectFrame: "Select frame material",
        tireLabel: "Tire",
        selectTire: "Select tire type",
        brakeLabel: "Brake",
        selectBrake: "Select braking system",
        wheelCountLabel: "Wheel Count",
        selectWheelCount: "Select wheel count",
        wheelLabel: "Wheel",
        selectWheel: "Select wheel size",
        certificationLabel: "Certification",
        selectCertification: "Select certification",
        allOption: "ALL",
      },
      topBadge: "★ OFFICIAL MOBILITY BASELINE DATABASE",
      seoPills: {
        balanceBikeToddler: "BALANCE BIKE TODDLER",
        twinStroller: "TWIN STROLLER",
        toddlerBike: "TODDLER BIKE",
        kidsElectricScooter: "KIDS ELECTRIC SCOOTER",
      },
      compareLimitTip: "Limit reached: You can compare up to 4 models. Please remove one first.",
      saveTips: {
        loginRequired: "Log in to save products.",
        removed: "Removed from saved list.",
        saved: "Saved. View it in your member center.",
      },
      productCard: {
        viewMetricsAriaPrefix: "View full metrics for",
        scoreTitle: "Score",
        capacityTitle: "Capacity",
        adminEditTitle: "Edit in Admin",
        adminEditLabel: "Admin Edit",
        compareAria: "Add to compare",
        saveAria: "Save product",
      },
      pagination: {
        prevPageAria: "Go to previous page",
        nextPageAria: "Go to next page",
        pageAriaPrefix: "Page",
        pageAriaTemplate: "Page {current} of {total}",
      },
      history: {
        title: "Recently Viewed Product",
        subtitle: "Quickly retrieve strollers you investigated recently (Cached in your browser)",
      },
      businessCopy: {
        descriptionTemplates: {
          kidsBikeZh: "这款专为幼童研发的专业儿童自行车采用高强度车架及科学防摔重心设计。 {base}",
          kidsBikeEn: "This highly certified toddler bike features premium structural geometry and superb braking safety. {base}",
          balanceBikeZh: "这台专业婴儿平衡车旨在安全锻炼儿童本体前庭系统和手腿协调力。 {base}",
          balanceBikeEn: "This ergonomic balance bike toddler leverages ultra-lightweight alloys for the ultimate safe learning experience. {base}",
          twinStrollerZh: "这款顶级双胞胎双人婴儿车的五点式防护设计和全地形减震系统给予两个宝宝全方位的舒适与放心。 {base}",
          twinStrollerEn: "This high-performance double twin stroller incorporates state-of-the-art shock absorption and premium responsive seating for families with multiples. {base}",
          electricScooterZh: "作为一款专业且安全的儿童电动滑板车，它配备了母体优先遥控制动及安全限速熔断。 {base}",
          electricScooterEn: "Engineered as an award-winning kids electric scooter, this model ensures optimal velocity limits and dynamic brake responsiveness. {base}",
        },
        generatedSummary: {
          travelZh: "适合出行场景的轻便旅行推车，强调紧凑收纳、机场携带与日常快速折叠。",
          travelSystemZh: "旅行系统套装，兼顾婴儿安全座椅衔接、家庭通勤与新生儿出行便利性。",
          joggerZh: "面向户外慢跑和公园路面的三轮推车，重点关注稳定性、轮组通过性与推行控制。",
          twinZh: "双座推车方案，适合双胞胎或二孩家庭，重点关注座舱空间与转向稳定性。",
          balanceZh: "儿童平衡车入门选择，帮助建立低速控车、转向协调与初期骑行信心。",
          scooterZh: "儿童滑板车方案，适合短途玩耍与平衡训练，重点关注转向反馈和低龄稳定性。",
          carSeatZh: "儿童安全座椅选择，重点关注安装兼容性、侧向防护与日常乘车安全。",
          defaultZh: "基于品类参数与家庭使用场景整理的候选产品，适合进一步比较重量、价格与安全配置。",
          travelEn: "Compact travel stroller for airport trips, fold-friendly storage, and everyday lightweight handling.",
          travelSystemEn: "Travel system bundle pairing stroller mobility with infant car seat compatibility for daily family trips.",
          joggerEn: "Jogging stroller option for park paths and active families, focused on stability, wheel control, and smoother pushing.",
          twinEn: "Twin stroller pick for twins or two-child families, balancing cabin space, steering stability, and shared outings.",
          balanceEn: "Toddler balance bike focused on early confidence, low-speed control, and first-ride coordination.",
          scooterEn: "Kids scooter option for short rides and balance practice, with emphasis on steering feedback and beginner stability.",
          carSeatEn: "Child car seat option focused on installation fit, side-impact protection, and everyday passenger safety.",
          defaultEn: "Curated product candidate for comparing weight, price, safety configuration, and family-use fit.",
        },
        capacity: {
          formattedZh: "{value} 磅 ({duty})",
          formattedEn: "{value}# ({duty})",
          defaults: {
            wagonDouble: { value: "150", duty: "H" },
            stroller: { value: "50", duty: "S" },
            bike: { value: "110", duty: "H" },
            fallback: { value: "150", duty: "H" },
          },
        },
        auditLabels: {
          sideImpactZh: "侧向防护结构认证",
          sideImpactEn: "SideImpact",
          allTerrainStableZh: "全地形避震稳定",
          allTerrainStableEn: "AllTerrain",
          allTerrainSafeZh: "全地形安全避震",
          allTerrainSafeEn: "AllTerrain",
          lowCogZh: "低重心控车安全",
          lowCogEn: "LowCOG",
        },
        logicTokens: {
          keywordPresence: {
            kidsBike: "toddler bike",
            balanceBike: "balance bike toddler",
            twinStroller: "double twin stroller",
            electricScooter: "kids electric scooter",
          },
          categorySignals: {
            stroller: ["stroller"],
            balance: ["balance"],
            bike: ["bike"],
            bicycle: ["bicycle"],
            wagonOrDouble: ["wagon", "double"],
            carSeatOrSafetySeat: ["car_seat", "safety_seat"],
            scooter: ["scooter"],
          },
          electricSignals: ["electric", "motorized", "battery", "e-scooter", "e-bike", "mx350"],
          twinSignals: ["twin", "double", "sibling", "double twin stroller", "twin stroller", "双人"],
          travelSignals: ["travel stroller", "lightweight stroller", "umbrella stroller", "compact stroller", "cabin", "portable", "travel", "lightweight", "umbrella", "轻便", "旅行", "便携"],
          heavySignals: ["jogger", "jogging", "double twin stroller", "double", "twin stroller", "twin", "双人", "慢跑"],
          balanceSignals: ["balance bike", "平衡车"],
          generatedSummarySignals: {
            travel: ["airplane", "airline", "compact", "travel"],
            travelSystem: ["car seat", "travel system", "infant"],
            jogger: ["jogger", "jogging", "runner"],
            twin: ["double", "twin"],
            balance: ["balance"],
            scooter: ["scooter"],
            carSeat: ["car seat"],
          },
          auditSignals: {
            suspension: ["suspension", "all-terrain", "shock"],
          },
        },
      },
    },
    reviews: {
      breadcrumb: "REVIEWS",
      badge: "★ INDEPENDENT LAB TESTING & REVIEWS",
      heroTitle: "Expert All Kids Bike, Stroller & Travel Stroller & Jogging Stroller and Ride-On Toy Reviews",
      heroDescription: "Our portal specializes in professional stroller reviews, helping parents find the ideal travel stroller, high-performance jogging stroller, and safe toddler bike. Every single travel stroller, rugged jogging stroller, and toddler bike model is purchased anonymously and put through strict mechanical tests. Read our direct stroller reviews below with complete biomechanical safety ratings.",
      smartFinderTitle: "Unsure which model fits your child best?",
      smartFinderDescription: "We map physical dimensions to safe geometry. Launch our interactive Smart Review Finder on the Buyer's Guide page to find ideal matches instantly!",
      smartFinderCta: "GO TO SMART FINDER TOOL ➔",
      sections: {
        strollerTitle: "Kids Stroller Reviews: Travel Stroller & Jogging Stroller",
        strollerDesc: "Explore our latest stroller reviews to compare travel stroller models and high-speed jogging stroller variants. We evaluate travel stroller flight compactness and jogging stroller hub friction safety.",
        bikeTitle: "Kids Bike Reviews",
        bikeDesc: "Our pedal-assisted toddler bike reviews detail structural configurations. Compare toddler bike models by braking parameters, chain protection, and fork geometry.",
        balanceTitle: "Balance Bike Reviews",
        balanceDesc: "Discover top-rated infant ride-ons. Read detailed balance reviews focusing on child low centers of gravity, frame weight, and structural steering safety limits.",
        scooterTitle: "Kids Scooter Reviews",
        scooterDesc: "Kick-on scooter reviews verifying lean-to-steer rebound mechanisms and PU wear-resistant flashing wheel grids.",
        electricTitle: "Kids Electric Car Reviews",
        electricDesc: "Uncompromising ride-on reviews prioritizing electrical insulation parameters and parental wireless kill locks.",
        noElectricData: "No electric car evaluations currently compiled.",
      },
      cta: {
        stroller: "Stroller Review ➔",
        bike: "Toddler Bike Audit ➔",
        balance: "Balance Ride Report ➔",
        scooter: "Kids Scooter Review ➔",
        product: "Product Review ➔",
      },
      standardsTitle: "Independent Rigor & Certification Compliance",
      standardsSubtitle: "BalanceBikeToddler LAB STANDARDS",
      standardsDesc: "We stand on strict compliance. Every travel stroller model, balance bike, and kids electric car is subjected to dynamic rolling stress telemetry. We receive 0% direct corporate backing, keeping our scores purely consumer-protective.",
      radarAriaLabel: "Scoring radar chart",
      reviewTypes: {
        single: "Best Travel Stroller",
        compare: "Best Jogging Stroller",
        value: "Balance Bike Reviews",
        ranking: "Stroller Reviews",
        safety: "Safety Audits",
      },
      reportBadges: {
        report: "REPORT",
        comparison: "COMPARISON",
        valuePick: "VALUE PICK",
        topRanking: "TOP RANKING",
        safetySpecs: "SAFETY SPECS",
        expertReport: "EXPERT REPORT",
      },
      detailTitleSuffix: "Review",
      summaryTitle: "Review Lab Insight",
      prosTitle: "Pros",
      consTitle: "Cons",
      keywordPills: {
        travelStroller: "Travel Stroller",
        joggingStroller: "Jogging Stroller",
        balanceBike: "Balance Bike",
        kidsBike: "Toddler Bike",
        kidsScooter: "Kids Scooter",
        kidsElectricCar: "Kids Electric Car",
      },
      businessCopy: {
        fallbackBrandZh: "该高端型号",
        verdictTemplates: {
          strollerZh: "【实验室评测】{brand} {modelName} 拥有极佳的抗震力学构造与顺畅微操。总体实测得分 {rating}，能给予宝宝全天候的前庭保护。",
          balanceZh: "【实验室评测】{brand} 儿童平衡车在安全转弯限位与重心分布上表现极为优秀。总体得分 {rating}，非常有利于宝宝四肢骨骼和平衡觉早期发育。",
          bikeZh: "【实验室评测】{brand} 双手刹儿童自行车重量适中、制动力线性安全。物理拆解评分 {rating}，保障宝宝的安全骑行。",
          defaultZh: "【实验室评测】{brand} 车辆安全框架厚实，在震荡抗疲劳稳定性物理实验中表现优异。总体实测评级达 {rating} 分，非常高分可靠。",
          strollerEn: "[Lab Report] The {cleanBrand} stroller stands out for highly responsive handling and airplane-friendly folding geometry. Scoring {rating} overall, its multi-terrain suspension is ideal for active parents seeking travel strollers.",
          balanceEn: "[Lab Report] Engineering a lightweight solid frame, the {cleanBrand} balance bike ensures stable low-COG ride control and safety steering. Earning a {rating} overall mark, it is perfect for early balance skills training.",
          bikeEn: "[Lab Report] Earning a robust {rating} safety rating, this {cleanBrand} kids bicycle features highly consistent brakes and dynamic pedal support, serving as a dependable choice for young riders.",
          defaultEn: "[Lab Report] Rigorously validated for framework stiffness, tire grip, and weight capacity, this {cleanBrand} model secures an outstanding {rating} overall score under simulated road test conditions.",
        },
        dynamicCta: {
          strollerZh: "阅读婴儿车深度审计报告 ➔",
          balanceZh: "阅读平衡车学步专项测议 ➔",
          scooterZh: "阅读滑板车安全性能报告 ➔",
          bikeZh: "阅读儿童自行车力学测评 ➔",
          defaultZh: "阅读完整产品测评报告 ➔",
          strollerEn: "Stroller Review ➔",
          balanceEn: "Balance Ride Report ➔",
          scooterEn: "Kids Scooter Review ➔",
          bikeEn: "Toddler Bike Audit ➔",
          defaultEn: "Product Review ➔",
        },
        logicTokens: {
          verdictCategorySignals: {
            stroller: ["stroller"],
            balance: ["balance"],
            bikeOrBicycle: ["bike", "bicycle"],
          },
          ctaSignals: {
            stroller: ["stroller", "jogger", "travel"],
            balance: ["balance"],
            scooter: ["scooter"],
            bikeOrBicycle: ["bike", "bicycle"],
          },
          focusSignals: {
            exclude: ["dirt bike", "dirtbike", "motocross", "motorcycle"],
            include: ["stroller", "balance", "bicycle", "bike", "scooter", "off-road", "off road"],
          },
          categoryBucketSignals: {
            stroller: ["stroller", "jogger"],
            strollerExclude: ["car_seat"],
            balance: ["balance"],
            scooter: ["scooter"],
            bikeExact: ["kids_bikes", "bicycle"],
            bikeExclude: ["balance", "tricycle", "scooter"],
          },
          commercialSeedSignals: {
            travel: ["yoyo", "travel stroller", "coast rider", "mompush"],
            jogger: ["bob gear", "jogging stroller", "jogger"],
            chiccoBravo: ["chicco", "bravo"],
          },
          floorSignals: {
            strollerLike: ["stroller", "wagon", "jogger"],
            balanceLike: ["balance"],
            bikeLike: ["bike", "bicycle", "kids_bikes"],
            bikeExclude: ["balance"],
            scooterLike: ["scooter"],
            travel: ["travel", "butterfly", "lightweight", "compact"],
            jogging: ["jogger", "jogging", "gt2", "expedition"],
            electricCarLike: ["electric", "car", "vehicle"],
          },
        },
      },
    },
    news: {
      breadcrumbGlobal: "GLOBAL NEWS",
      detailBack: "Back to News",
      detailSummary: "Summary: ",
      detailReadPrefix: "",
      detailViewsPrefix: "Views: ",
      guidesTitle: "BalanceBikeToddler Lab: Recommended Safety Guides",
      guideBadge: "Authoritative Guide",
      guideRead: "Read Guide",
      closeReading: "Close Reading",
      heroBadge: "GLOBAL MOBILE SAFETY RESEARCH",
      heroTitle: "Latest News, Guides & Tips for Kids Bikes & Strollers",
      heroSubtitle: "Track industry updates for a premium kids bikes，such as  kids electric bike or a rugged electric dirt bike for kids. We also review foldable electric scooter launches and kids e-scooter safety data.",
      categoryTabs: {
        all: "All Articles",
        newProduct: "New Launches",
        science: "Science & Tips",
        brandNews: "Brand News",
        industry: "Industry Trends",
      },
      noMatches: "No matches found.",
      latestTitle: "Latest Updates: Foldable Electric Scooter & Dirt Bike Launches",
      latestDesc: "Follow kids electric bike safety standards, electric dirt bike for kids launches, and foldable electric scooter commute trends.",
      readMore: "read →",
      globalNewsSeoName: "Latest News, Guides & Tips for Kids Bikes & Strollers",
      fallbackSummary: "BalanceBikeToddler industry updates and safety insights.",
      fallbackContent: "Content in English is being updated. Please check back soon.",
      fallbackAuthor: "BalanceBikeToddler Global Safety Lab",
      fallbackReadTime: "5 min read",
      likeAria: "Like article",
      shareAria: "Share article",
      prevPageAria: "Go to previous page",
      nextPageAria: "Go to next page",
    },
    about: {
      breadcrumb: "ABOUT US",
      heroBadge: "ESTABLISHED IN 2026 · Independent Premium Platform",
      heroTitle: "BalanceBikeToddler: Your Independent Kids' Mobility Lab",
      heroDesc: "We audit jogging stroller, balance bike, toddler bike, and kids scooter safety with independent mechanical methods to answer one simple question: Is this truly safe for your child's growth?",
      partnershipTitle: "Partnerships & Cooperation",
      partnershipDesc: "We welcome meaningful collaborations that prioritize child safety. This includes lab certification sharing, industry report syndication, and media partnerships.",
      contactCta: "Contact Us",
    },
  },
};

export function getPageCopy(lang: Locale): PageCopy {
  return PAGE_COPY[lang] || PAGE_COPY.en;
}
