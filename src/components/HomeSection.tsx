import { 
  Award,
  ShieldCheck, 
  Scale, 
  Star,
  Zap,
  ArrowRight,
  Bike,
  Smile,
  Footprints,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Product, CurrencyData } from "../types";
import { translations, translateProduct } from "../lib/translate";
import { SCRAPED_CATEGORY_CATALOG } from "../config/scrapedCategoryCatalog";
import { resolveProductImages, FALLBACK_PRODUCT_IMAGE } from "../lib/productImages";
import { getProductImageAlt } from "../lib/productSeoText";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";
import SeoKeywordPanel from "./common/SeoKeywordPanel";
import Breadcrumbs from "./Breadcrumbs";
import MatchingWizard from "./MatchingWizard";

const KIDS_BIKE_CATEGORY_DEFAULT_IMAGE =
  "https://store.balancebiketoddler.com/kids_bikes/JOYSTAR/Rank_1_ASIN_B08Q7TMRWR_JOYSTAR%20Little%20Daisy%20Kids%20Bike%20for%20Girls%20Boys%20Ages/images/primary.jpg";
const JOGGER_STROLLER_DEFAULT_IMAGE =
  "/images/home/jogging-stroller-default.jpg";
const BALANCE_BIKE_DEFAULT_IMAGE =
  "https://store.balancebiketoddler.com/balance_bike/JMMD/Rank_4_ASIN_B0CFDX97YD_JMMD%206%20in%201%20Toddler%20Bike%20with%20Push%20Handle%20for%20Kids/images/primary.jpg";
const SCOOTER_DEFAULT_IMAGE =
  "https://store.balancebiketoddler.com/scooters/Green/Rank_7_ASIN_B0DZG3QYLR_Green%20Mini%203%20Wheel%20Scooter%20for%20Kids%20%20Lean-to-Steer/images/primary.jpg";

const AWARD_DEFAULT_IMAGE_MAP: Record<string, string> = {
  stroller: JOGGER_STROLLER_DEFAULT_IMAGE,
  balance: BALANCE_BIKE_DEFAULT_IMAGE,
  value: SCOOTER_DEFAULT_IMAGE,
};

const CATEGORY_DEFAULT_IMAGE_MAP: Record<string, string> = {
  stroller: JOGGER_STROLLER_DEFAULT_IMAGE,
  jogger_stroller: JOGGER_STROLLER_DEFAULT_IMAGE,
  balance_bike: BALANCE_BIKE_DEFAULT_IMAGE,
  kids_bikes: KIDS_BIKE_CATEGORY_DEFAULT_IMAGE,
  scooters: SCOOTER_DEFAULT_IMAGE,
  kids_scooters: SCOOTER_DEFAULT_IMAGE,
};

const HOME_CARD_DEFAULT_IMAGES = [
  JOGGER_STROLLER_DEFAULT_IMAGE,
  BALANCE_BIKE_DEFAULT_IMAGE,
  KIDS_BIKE_CATEGORY_DEFAULT_IMAGE,
  SCOOTER_DEFAULT_IMAGE,
];

interface HomeSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  setActiveTab: (tab: any) => void;
  childProfile: any;
  setChildProfile: (p: any) => void;
  onSelectCategory: (categoryId: string) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
  isBBTTheme?: boolean;
}

type ImageLoadState = {
  loaded: boolean;
  failed: boolean;
  fallback: boolean;
  retryCount: number;
};

export default function HomeSection({
  productsData,
  onSelectProduct,
  setActiveTab,
  childProfile,
  setChildProfile,
  onSelectCategory,
  lang = "zh",
  currencyData,
  isBBTTheme = false
}: HomeSectionProps) {

  const categoryAliasMap: Record<string, string[]> = {
    stroller: ["stroller"],
    double_stroller: ["double_stroller", "double stroller"],
    jogger_stroller: ["jogger_stroller", "jogging stroller"],
    balance_bike: ["balance_bike", "balance", "balance bike"],
    kids_bikes: ["kids_bikes", "bikes", "bike", "kids bike"],
    kids_tricycles: ["kids_tricycles", "tricycle", "tricycles"],
    scooters: ["scooters", "scooter"],
    electric_vehicles: ["electric_vehicles", "electric", "ev"],
    car_seat: ["car_seat", "car seat"],
  };

  const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  const t = translations[lang];
  const [imageLoadState, setImageLoadState] = useState<Record<string, ImageLoadState>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Background Carousel Slideshow for Hero Section (2 scenario-based images: stroller & balance bike)
  const bgImages = useMemo(() => [
    "https://plus.unsplash.com/premium_photo-1681881804080-ab1e78652c98?fm=jpg&q=60&w=960&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJhbXxlbnwwfHwwfHx8MA%3D%3D", // Stroller scenario
    "https://plus.unsplash.com/premium_photo-1661715303160-9fecfaba31a9?fm=jpg&q=60&w=960&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGtpZCUyMGJpa2V8ZW58MHx8MHx8fDA%3D"  // Balance bike / kids active riding scenario
  ], []);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bgImages]);

  const openWizard = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({ ...(window.history.state || {}), kidsmobiWizard: true }, "", window.location.href);
    }
    setIsWizardOpen(true);
  };

  useEffect(() => {
    const handlePopstate = () => {
      setIsWizardOpen(false);
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const resolveStableImageSrc = (imageKey: string, sourceUrl: string) => {
    const state = imageLoadState[imageKey];
    if (state?.fallback) {
      return FALLBACK_PRODUCT_IMAGE;
    }
    const safeSource = sourceUrl || FALLBACK_PRODUCT_IMAGE;
    if ((state?.retryCount || 0) > 0 && safeSource !== FALLBACK_PRODUCT_IMAGE) {
      const separator = safeSource.includes("?") ? "&" : "?";
      return `${safeSource}${separator}retry=${state?.retryCount}`;
    }
    return safeSource;
  };

  const handleCardImageLoad = (imageKey: string) => {
    setImageLoadState((prev) => ({
      ...prev,
      [imageKey]: {
        ...(prev[imageKey] || { retryCount: 0 }),
        loaded: true,
        failed: false,
        fallback: false,
      },
    }));
  };

  const handleCardImageError = (imageKey: string, sourceUrl: string) => {
    setImageLoadState((prev) => {
      const current = prev[imageKey] || { loaded: false, failed: false, fallback: false, retryCount: 0 };
      if (current.retryCount < 1 && sourceUrl && sourceUrl !== FALLBACK_PRODUCT_IMAGE) {
        return {
          ...prev,
          [imageKey]: {
            ...current,
            loaded: false,
            failed: false,
            fallback: false,
            retryCount: current.retryCount + 1,
          },
        };
      }
      return {
        ...prev,
        [imageKey]: {
          ...current,
          loaded: true,
          failed: true,
          fallback: true,
        },
      };
    });
  };

  const formatHomeScore = (value: unknown) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "";
    }
    return numeric.toFixed(2);
  };

  const resolveHomepageCategoryLabel = (product?: Product) => {
    const searchable = normalizeCategory(`${(product as any)?.categoryId || ""} ${product?.category || ""} ${product?.name || ""}`);
    if (searchable.includes("jogger") || searchable.includes("jogging_stroller")) {
      return lang === "zh" ? "慢跑推车" : "Jogging Stroller";
    }
    if (searchable.includes("balance_bike") || (searchable.includes("balance") && !searchable.includes("tricycle"))) {
      return lang === "zh" ? "平衡车" : "Balance Bike";
    }
    if (
      searchable.includes("kids_bikes") ||
      searchable.includes("tricycle") ||
      searchable.includes("trike") ||
      (searchable.includes("bike") && !searchable.includes("balance"))
    ) {
      return lang === "zh" ? "儿童自行车" : "Kids Bike";
    }
    if (searchable.includes("scooter")) {
      return lang === "zh" ? "儿童滑板车" : "Kids Scooter";
    }
    if (searchable.includes("stroller")) {
      return lang === "zh" ? "婴儿推车" : "Stroller";
    }
    return lang === "zh" ? "精选产品" : "Featured Product";
  };

  const resolveHomepageProductTitle = (product?: Product) => {
    if (!product) return lang === "zh" ? "评测中" : "Evaluating";
    const localized = translateProduct(product, lang);
    const brand = String(localized.brand || product.brand || "").trim();
    const categoryLabel = resolveHomepageCategoryLabel(product);
    if (brand && categoryLabel) {
      return `${brand} ${categoryLabel}`.trim();
    }
    return String(localized.name || product.name || categoryLabel).trim();
  };

  const resolveHomepageProductSummary = (product?: Product) => {
    if (!product) {
      return lang === "zh"
        ? "当前正在更新该卡片样本，完成后将展示对应产品结论。"
        : "This card sample is being refreshed. Matching product findings will appear once ready.";
    }
    const localizedDescription = String((product as any)?.[lang]?.description || "").trim();
    const summary = String(localizedDescription || product.description || product.editorVerdict || "").trim();
    if (summary) return summary;
    return lang === "zh"
      ? "该卡片展示当前绑定产品的核心适用场景、结构特点与日常使用表现。"
      : "This card highlights the bound product's fit, structure, and everyday ride behavior.";
  };

  const scrapedCategoryCards = useMemo(() => {
    return SCRAPED_CATEGORY_CATALOG.slice(0, 8).map((entry) => ({
      ...entry,
      label: lang === "zh" ? entry.zh : entry.en,
    }));
  }, [lang]);

  const homeEligibleProducts = useMemo(() => {
    return productsData.filter((product) => {
      const rawRank = String(
        (product as any).Rank || (product as any).rank || (product as any).sourceRank || ""
      )
        .trim()
        .toLowerCase();
      if (rawRank === "similar") {
        return false;
      }

      const mediaCandidates = [
        String(product.imageUrl || ""),
        ...(product.productImageUrls || []),
        ...(product.galleryUrls || []),
      ]
        .map((value) => String(value || "").toLowerCase())
        .filter(Boolean);

      // Scraped similar records usually carry Rank_Similar in asset paths.
      if (mediaCandidates.some((value) => value.includes("rank_similar_"))) {
        return false;
      }

      return true;
    });
  }, [productsData]);

  const homeVisualProducts = useMemo(() => {
    return homeEligibleProducts.filter((product) => {
      const coverUrl = resolveProductImages(product).coverUrl;
      return Boolean(coverUrl) && coverUrl !== FALLBACK_PRODUCT_IMAGE;
    });
  }, [homeEligibleProducts]);

  const categoryTopProductMap = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const entry of SCRAPED_CATEGORY_CATALOG) {
      const aliases = categoryAliasMap[entry.id] || [entry.id];
      const targetId = normalizeCategory(entry.id);
      const candidates = homeVisualProducts.filter((product) => {
        const normalizedCategory = normalizeCategory(product.category || "");
        const normalizedCategoryId = normalizeCategory((product as any).categoryId || "");
        const searchable = normalizeCategory(
          [product.category, (product as any).categoryId, product.name, product.brand]
            .filter(Boolean)
            .join(" ")
        );

        // Prefer strict category/categoryId matching to avoid cross-category image bleed.
        if (normalizedCategoryId === targetId || normalizedCategory === targetId) {
          return true;
        }

        if (targetId === "balance_bike") {
          return normalizedCategoryId.includes("balance_bike") || normalizedCategory.includes("balance_bike");
        }

        if (targetId === "kids_bikes") {
          const isKidsBike = normalizedCategoryId.includes("kids_bikes") || normalizedCategory.includes("kids_bikes");
          const isOtherBikeFamily = searchable.includes("balance") || searchable.includes("tricycle");
          return isKidsBike && !isOtherBikeFamily;
        }

        if (targetId === "scooters") {
          return (
            normalizedCategoryId.includes("scooter") ||
            normalizedCategory.includes("scooter") ||
            normalizedCategoryId === "kids_scooters"
          );
        }

        return aliases.some((alias) => {
          const normalizedAlias = normalizeCategory(alias);
          return (
            normalizedCategory.includes(normalizedAlias) ||
            normalizedCategoryId.includes(normalizedAlias) ||
            searchable.includes(normalizedAlias)
          );
        });
      });

      const found = [...candidates].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
      if (found) map[entry.id] = found;
    }
    return map;
  }, [homeVisualProducts]);

  const getCategoryPriority = (rawCategory?: string) => {
    const normalized = normalizeCategory(rawCategory || "");
    if (normalized.includes("stroller")) return 0;
    if (normalized.includes("balance")) return 1;
    return 2;
  };

  // Outstanding Selection (high scores)
  const topSelections = [...homeVisualProducts]
    .sort((a, b) => {
      const priorityDelta = getCategoryPriority(a.categoryId || a.category) - getCategoryPriority(b.categoryId || b.category);
      if (priorityDelta !== 0) return priorityDelta;
      return (b.overallScore || 0) - (a.overallScore || 0);
    })
    .slice(0, 4);

  const seoProductCards = useMemo(() => {
    const normalizedSearchText = (product: Product) =>
      normalizeCategory(`${(product as any).categoryId || ""} ${product.category || ""} ${product.brand || ""} ${product.name || ""}`);

    const isStrictBalanceBike = (product: Product) => {
      const text = normalizedSearchText(product);
      const hasBalanceSignals = text.includes("balance_bike") || text.includes("balance");
      const hasWrongSignals = text.includes("stroller") || text.includes("jogger") || text.includes("tricycle");
      return hasBalanceSignals && !hasWrongSignals;
    };

    const findByCategory = (includeTokens: string[], excludeTokens: string[] = []) => {
      const rows = homeVisualProducts.filter((product) => {
        const text = normalizedSearchText(product);
        const includes = includeTokens.some((token) => text.includes(token));
        const excludes = excludeTokens.some((token) => text.includes(token));
        return includes && !excludes;
      });
      return [...rows].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
    };

    const fallbackByType = {
      stroller: findByCategory(["jogger_stroller", "jogging_stroller", "stroller"]),
      balance: findByCategory(["balance_bike", "balance"], ["stroller", "jogger", "tricycle"]),
      kidsBike: findByCategory(["kids_bikes", "kids_bike"], ["balance", "tricycle", "stroller", "scooter"]),
      scooter: findByCategory(["scooters", "kids_scooters", "kids_scooter"]),
    };

    const targets = [
      {
        key: "infans",
        match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("infans"),
        fallback: fallbackByType.stroller,
      },
      {
        key: "jmmd",
        match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("jmmd") && isStrictBalanceBike(product),
        fallback: fallbackByType.balance,
      },
      {
        key: "glerc",
        match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("glerc") && normalizeCategory(product.name).includes("rover"),
        fallback: fallbackByType.kidsBike,
      },
      {
        key: "green-mini",
        match: (product: Product) => normalizeCategory(product.name).includes("green_mini"),
        fallback: fallbackByType.scooter,
      },
    ];
    return targets.map((target, index) => ({
      key: target.key,
      product:
        homeVisualProducts.find(target.match) ||
        target.fallback ||
        topSelections[0] ||
        homeVisualProducts[index] ||
        homeVisualProducts[0],
    })).filter((item): item is { key: string; product: Product } => Boolean(item.product));
  }, [homeVisualProducts, topSelections]);

  const awardWinners = useMemo(() => {
    const strollerWinner =
      categoryTopProductMap.jogger_stroller ||
      categoryTopProductMap.stroller ||
      seoProductCards.find((card) => card.key === "infans")?.product;

    const balanceCandidates = homeVisualProducts.filter((product) => {
      const categoryText = normalizeCategory(`${(product as any).categoryId || ""} ${product.category || ""}`);
      return categoryText.includes("balance");
    });

    const strictBalanceCandidates = balanceCandidates.filter((product) => {
      const searchable = normalizeCategory(`${product.brand || ""} ${product.name || ""} ${(product as any).categoryId || ""} ${product.category || ""}`);
      const looksLikeBalanceBike = searchable.includes("balance_bike") || searchable.includes("balance");
      const looksLikeStroller = searchable.includes("stroller") || searchable.includes("jogger");
      return looksLikeBalanceBike && !looksLikeStroller;
    });

    const sortByScore = (rows: Product[]) =>
      [...rows].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    const balanceWinner =
      sortByScore(strictBalanceCandidates)[0] ||
      sortByScore(balanceCandidates)[0] ||
      categoryTopProductMap.balance_bike ||
      seoProductCards.find((card) => card.key === "jmmd")?.product;

    const kidsBikeWinner =
      categoryTopProductMap.kids_bikes ||
      homeVisualProducts.find((product) => {
        const searchable = normalizeCategory(`${(product as any).categoryId || ""} ${product.category || ""} ${product.name}`);
        return searchable.includes("kids_bikes") || (searchable.includes("bike") && !searchable.includes("balance"));
      });

    return {
      stroller: strollerWinner,
      balance: balanceWinner,
      kids_bikes: kidsBikeWinner,
    };
  }, [categoryTopProductMap, homeVisualProducts, seoProductCards]);

  const prioritizedCategoryCards = useMemo(() => {
    const englishLabelOverrides: Record<string, string> = {
      stroller: "Jogging Stroller",
      balance_bike: "Balance Bike",
      kids_bikes: "Kids Bike",
      scooters: "Kids Scooter",
    };
    const zhLabelOverrides: Record<string, string> = {
      stroller: "婴儿慢跑手推车",
      balance_bike: "儿童平衡车",
      kids_bikes: "儿童自行车",
      scooters: "儿童滑板车",
    };
    const englishDescOverrides: Record<string, string> = {
      stroller: "Discover our top-rated jogging stroller picks, rigorously lab-tested for all-terrain suspension, secure braking, and ultimate child comfort during your runs.",
      balance_bike: "Find the safest balance bike for your toddler. We evaluate frame weight, tire grip, and ergonomics to help them learn to ride with confidence.",
      kids_bikes: "Compare the best 12-inch to 16-inch kids bike models. Our unbiased reviews focus on braking power, structural geometry, and pedal stability.",
      scooters: "Explore our expertly reviewed kids scooter selection. From stable 3-wheelers to agile 2-wheelers, we test for deck strength and steering safety.",
    };
    const zhDescOverrides: Record<string, string> = {
      stroller: "发现我们评分领先的慢跑婴儿车，经过全地形悬挂、安全刹车及宝宝舒适度的严格实验室测试。",
      balance_bike: "为您的幼儿寻找最安全的平衡车。我们评估车架重量、轮胎抓地力和人体工学，帮助他们自信骑行。",
      kids_bikes: "比较最优秀的 12 英寸至 16 英寸儿童自行车。我们的中立评测聚焦于制动力学、车架几何与脚踏稳定性。",
      scooters: "探索我们经专业评测的儿童滑板车系列。从稳定的三轮车到灵敏的两轮车，我们测试踏板强度和转向安全设计。",
    };

    const targetOrder = ["stroller", "balance_bike", "kids_bikes", "scooters"];
    return targetOrder.map(id => {
      const entry = SCRAPED_CATEGORY_CATALOG.find(c => c.id === id);
      if (!entry) return null;
      return {
        ...entry,
        label: lang === "zh" ? (zhLabelOverrides[id] || entry.zh) : (englishLabelOverrides[id] || entry.en),
        desc: lang === "zh" ? (zhDescOverrides[id] || "") : (englishDescOverrides[id] || ""),
        slug: `/products/${id === "scooters" ? "kids_scooters" : id}`,
      };
    }).filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [lang]);

  const strollerProducts = useMemo(() => {
    const strollers = homeVisualProducts.filter((product) => {
      const searchable = normalizeCategory(`${product.category || ""} ${(product as any).categoryId || ""} ${product.name}`);
      return searchable.includes("stroller") || searchable.includes("jogger") || searchable.includes("pram") || searchable.includes("pushchair");
    });
    return [...strollers].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const balanceBikeProducts = useMemo(() => {
    const balance = homeVisualProducts.filter((product) => {
      const searchable = normalizeCategory(`${product.category || ""} ${(product as any).categoryId || ""} ${product.name}`);
      const isBalance = searchable.includes("balance") || searchable.includes("balance_bike");
      return isBalance;
    });
    return [...balance].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const kidsBikeProducts = useMemo(() => {
    const bikes = homeVisualProducts.filter((product) => {
      const searchable = normalizeCategory(`${product.category || ""} ${(product as any).categoryId || ""} ${product.name}`);
      const isBalance = searchable.includes("balance");
      const isBike = searchable.includes("bike") || searchable.includes("kids_bikes");
      return isBike && !isBalance;
    });
    return [...bikes].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const kidsScooterProducts = useMemo(() => {
    const scooters = homeVisualProducts.filter((product) => {
      const searchable = normalizeCategory(`${product.category || ""} ${(product as any).categoryId || ""} ${product.name}`);
      return searchable.includes("scooter") || searchable.includes("scooters") || searchable.includes("kids_scooters");
    });
    return [...scooters].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const kidsElectricCarProducts = useMemo(() => {
    const cars = homeVisualProducts.filter((product) => {
      const searchable = normalizeCategory(`${product.category || ""} ${(product as any).categoryId || ""} ${product.name}`);
      return (
        searchable.includes("electric_vehicles") ||
        searchable.includes("electric_car") ||
        searchable.includes("electric_vehicle") ||
        searchable.includes("electric_toy") ||
        searchable.includes("battery_powered") ||
        searchable.includes("ev")
      );
    });
    return [...cars].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const renderProductCard = (p: Product, idx: number) => {
    const dp = translateProduct(p, lang);
    const title = resolveHomepageProductTitle(p);
    const snapshot = resolveHomepageProductSummary(p);
    return (
       <div 
        key={p.id} 
        onClick={() => onSelectProduct(p)}
        className="group h-full min-h-90 cursor-pointer bg-white rounded-4xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all flex flex-col"
       >
         <div className="relative h-52 bg-slate-50 overflow-hidden">
            {(() => {
              const imageKey = `product-${p.id}`;
              const candidateCoverUrl = resolveProductImages(p).coverUrl;
              const sourceUrl = candidateCoverUrl && candidateCoverUrl !== FALLBACK_PRODUCT_IMAGE
                ? candidateCoverUrl
                : HOME_CARD_DEFAULT_IMAGES[idx % HOME_CARD_DEFAULT_IMAGES.length];
              const state = imageLoadState[imageKey];
              return (
                <>
                  <img
                    src={resolveStableImageSrc(imageKey, sourceUrl)}
                    alt={getProductImageAlt(title)}
                    onLoad={() => handleCardImageLoad(imageKey)}
                    onError={() => handleCardImageError(imageKey, sourceUrl)}
                    className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.08]"
                  />
                  {!state?.loaded && (
                    <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
                  )}
                  {state?.failed && (
                    <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                      {lang === "zh" ? "已回退占位图" : "Fallback active"}
                    </span>
                  )}
                </>
              );
            })()}
         </div>
         <div className="p-6 space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{dp.brand}</span>
              {formatHomeScore(dp.overallScore) && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                  <span className="text-xs font-black">{formatHomeScore(dp.overallScore)}</span>
                </div>
              )}
            </div>
            <h3 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2 min-h-12">{title}</h3>
            <p className="text-[10px] text-slate-500 font-medium line-clamp-3 leading-relaxed min-h-12">{snapshot}</p>
         </div>
       </div>
    );
  };

  useEffect(() => {
    const canonicalUrl = window.location.origin + "/";
    const homepageItems = [
      ...topSelections.slice(0, 4).map((product) => ({
        name: translateProduct(product, lang).name,
        url: canonicalUrl,
      })),
      ...prioritizedCategoryCards.slice(0, 4).map((category) => ({
        name: category.label,
        url: canonicalUrl,
      })),
    ];

    setCollectionPageJsonLd("home-list", {
      name: lang === "zh" ? "KIDSMOBI 首页" : "KIDSMOBI Home",
      url: canonicalUrl,
      items: homepageItems,
    });

    // 动态注入 FAQPage 模型，助力 Google Rich Snippets 提取
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": lang === "zh" ? "KIDSMOBI 如何测试慢跑手推车的安全性？" : "How does KIDSMOBI test jogging strollers for safety?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lang === "zh" ? "我们对全地形悬挂系统、轮轴轴承强度 and 动态负载下的刹车可靠性进行严苛的物理测试，确保跑步过程中的儿童舒适性与极致保护。" : "We perform rigorous physical audits on all-terrain suspension, wheel-bearing strength, and braking reliability under dynamic loads to ensure ultimate child comfort and protection during runs."
          }
        },
        {
          "@type": "Question",
          "name": lang === "zh" ? "孩子几岁开始骑平衡车最合适？" : "What is the best age for a child to start using a balance bike?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lang === "zh" ? "孩子最早可在 18 个月大时开始尝试。我们聚焦于超轻量化车架、低座高设计和稳定的转向几何，帮助幼童建立自我平衡的信心。" : "Children can start as early as 18 months. We focus on lightweight frames, low seat heights, and stable steering geometry to help toddlers build self-balancing confidence."
          }
        },
        {
          "@type": "Question",
          "name": lang === "zh" ? "三轮滑板车对幼童来说比两轮更安全吗？" : "Are 3-wheel scooters safer than 2-wheelers for toddlers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lang === "zh" ? "是的，三轮滑板车的 lean-to-steer（倾斜重力转向）能防止紧急翻侧，并为幼儿提供极佳的横向稳定性。我们专门测试脚踏板强度与转向响应度。" : "Yes, lean-to-steer features on 3-wheel scooters prevent sudden flips and provide strong lateral stability for toddlers. We test deck resilience and steering responsiveness."
          }
        },
        {
          "@type": "Question",
          "name": lang === "zh" ? "儿童自行车的核心安全标准是什么？" : "What are the key safety standards for kids' bikes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lang === "zh" ? "所有车辆都必须符合 EN 71、ISO 8098 或 ASTM F963 等标准。我们实测链条罩安全性、制动锁死刹车距离、手把防护罩以及车架结构强度。" : "Every bike must comply with EN 71, ISO 8098, or ASTM F963 standards. We verify chain guard safety, braking locking distance, handle grip protection, and structural frame stiffness."
          }
        },
        {
          "@type": "Question",
          "name": lang === "zh" ? "为什么客观中立的第三方评测对家长的选购决策至关重要？" : "Why are neutral third-party reviews critical for parent decision-making?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": lang === "zh" ? "KIDSMOBI 不接受任何厂商赞助与竞选曝光收费。我们坚持独立评估，将科学层面的机械力学数据转化为值得信赖的买家购买信心。" : "KIDSMOBI accepts zero merchant sponsorship or paid placements. We test models independently, transforming scientific mechanical data into reliable parent buying confidence."
          }
        }
      ]
    };
    setJsonLd("home-faq", faqSchema);

    return () => {
      clearJsonLd("home-list");
      clearJsonLd("home-faq");
    };
  }, [lang, topSelections, prioritizedCategoryCards]);

  return (
    <div id="home_layout" className="space-y-24 pb-20">
      {isBBTTheme && (
        <Breadcrumbs
          lang={lang}
          onHomeClick={() => setActiveTab("home")}
          items={[{ label: lang === "zh" ? "首页概览" : "OVERVIEW", active: true }]}
        />
      )}

      {/* 1. Slogan Banner (Brand Identity - Upgraded/Redesigned to Match Mockup with Background Carousel) */}
      <section id="home_banner_anchor" className="relative rounded-[48px] bg-slate-950 border border-slate-800 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl min-h-[500px] flex items-center justify-center">
        {/* Ambient background carousel with smooth crossfade */}
        <div className="absolute inset-0 z-0">
          {bgImages.map((src, index) => (
            <div
              key={src}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center"
              style={{
                backgroundImage: `url(${src})`,
                opacity: index === currentBgIndex ? 0.62 : 0,
              }}
            />
          ))}
          {/* Elegant dark overlay mask to maintain high readability of white text */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/35 to-slate-950/85 mix-blend-multiply"></div>
          {/* Subtle warm glow or cool ambient lights */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 space-y-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            OFFICIAL BBT SAFETY AUDIT
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-5xl mx-auto drop-shadow-md">
            Best Kids Bikes, Scooters, Jogging Strollers & Cars
          </h1>
          
          <p className="text-slate-200 text-sm md:text-base max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-sm">
            Welcome to BalanceBikeToddler, your trusted global review site for kids wheeled toys.
          </p>

          <div className="pt-4 pb-2">
            <button
              onClick={() => setActiveTab("guides")}
              className="inline-flex items-center gap-3 px-10 py-5 bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
              FIND YOUR PERFECT RIDE IN 3 STEPS
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-white/10">
            {[
              { id: "kids_bikes", label: "KIDS BIKE", icon: Bike },
              { id: "balance_bike", label: "BALANCE BIKE", icon: Smile },
              { id: "scooters", label: "KIDS SCOOTER", icon: Sparkles },
              { id: "stroller", label: "JOGGING STROLLER", icon: Footprints },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectCategory(item.id)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/25 rounded-full text-[11px] font-black tracking-widest text-slate-100 uppercase shadow-md hover:border-white/45 transition-all cursor-pointer group backdrop-blur-md"
              >
                <item.icon className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Category Launchpad (品类入口) */}
      <section id="category_highlights_anchor" className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">
              {lang === "zh" ? "精选品类" : "Category Highlights"}
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Explore by Category: Find Your Perfect Kids' Mobility
            </h2>
            <p className="text-slate-500 font-medium">
              We compare frame ergonomics and stress tolerances across stroller and kids bike parameters.
            </p>
          </div>
          <a
            href="/products"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("products");
            }}
            className="text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "进入产品中心" : "Open Product Center"}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {prioritizedCategoryCards.map((cat) => (
            <a
              href={cat.slug}
              key={cat.id}
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory(cat.id);
              }}
              className="group h-full min-h-90 bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-100/70 transition-all duration-300 flex flex-col cursor-pointer"
            >
              <div className="relative h-52 bg-slate-50 overflow-hidden text-center">
                {(() => {
                  const imageKey = `category-${cat.id}`;
                  const topProduct = categoryTopProductMap[cat.id];
                  const productCoverUrl = topProduct ? resolveProductImages(topProduct).coverUrl : "";
                  const sourceUrl = productCoverUrl && productCoverUrl !== FALLBACK_PRODUCT_IMAGE
                    ? productCoverUrl
                    : (CATEGORY_DEFAULT_IMAGE_MAP[cat.id] || FALLBACK_PRODUCT_IMAGE);
                  const state = imageLoadState[imageKey];
                  return (
                    <>
                      <img
                        src={resolveStableImageSrc(imageKey, sourceUrl)}
                        alt={cat.label}
                        onLoad={() => handleCardImageLoad(imageKey)}
                        onError={() => handleCardImageError(imageKey, sourceUrl)}
                        className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.08]"
                      />
                      {!state?.loaded && (
                        <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
                      )}
                    </>
                  );
                })()}
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] bg-white/90 text-orange-600 font-black uppercase backdrop-blur-sm border border-orange-100 shadow-sm">
                  {lang === "zh" ? "精选" : "Featured"}
                </span>
              </div>

              <div className="p-6 bg-white flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <h3 className="text-slate-950 font-black text-lg leading-tight">{cat.label}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {lang === "zh" ? "品类入口" : "Category"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 5. Safety Audits (双横排网格 SEO 增强版) */}
      <section id="safety_audits_anchor" className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "安全专项检测" : "Safety Audits Hub"}</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Safety Audits: Double-check Before Purchasing</h2>
            <p className="text-slate-500 font-medium">
              Every kids bike, balance bike and kids scooter below has passed high-impact stress reviews and safety threshold ratings.
            </p>
          </div>
          <a 
            href="/reviews/safety"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("evaluations");
            }}
            className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "查看安全评测报告" : "View Safety Audits"} <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Subsection A: Best Stroller & Jogging Stroller */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Best Stroller & Jogging Stroller</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {lang === "zh" ? "精选高端与慢跑婴儿推车，重点测评悬挂避震性能与安全带固定系统。" : "Top-rated everyday and jogging strollers. We audit shock absorption, frame rigidity, and secure harness layouts."}
              </p>
            </div>
            <a
              href="/guides/best"
              onClick={(e) => {
                e.preventDefault();
                localStorage.setItem("selectedCategory", "best");
                localStorage.setItem("autoSelectWizardCategory", "stroller");
                if ((window as any).navigateToPath) {
                  (window as any).navigateToPath("/guides/best");
                  // Trigger category synchronizer
                  if (typeof (window as any).setActiveGuidesCategory === "function") {
                    (window as any).setActiveGuidesCategory("best");
                  }
                } else {
                  setActiveTab("guides");
                }
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors shrink-0 uppercase tracking-widest pl-4 flex items-center gap-1.5"
            >
              <span>{lang === "zh" ? "更多精选推荐" : "More Picks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {strollerProducts.map((p, idx) => renderProductCard(p, idx))}
          </div>
        </div>

        {/* Subsection B: Best Balance Bike */}
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Best Balance Bike</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {lang === "zh" ? "专为幼童打造的滑行平衡车测评，聚焦轮胎防滑、防侧翻限位及脚踏高度配置。" : "Safest toddler-friendly balance bikes. We test handle grips, turning limiters, and frame weights."}
              </p>
            </div>
            <a
              href="/guides/best"
              onClick={(e) => {
                e.preventDefault();
                localStorage.setItem("selectedCategory", "best");
                localStorage.setItem("autoSelectWizardCategory", "balance");
                if ((window as any).navigateToPath) {
                  (window as any).navigateToPath("/guides/best");
                  // Trigger category synchronizer
                  if (typeof (window as any).setActiveGuidesCategory === "function") {
                    (window as any).setActiveGuidesCategory("best");
                  }
                } else {
                  setActiveTab("guides");
                }
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors shrink-0 uppercase tracking-widest pl-4 flex items-center gap-1.5"
            >
              <span>{lang === "zh" ? "更多精选推荐" : "More Picks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {balanceBikeProducts.map((p, idx) => renderProductCard(p, idx + 1))}
          </div>
        </div>

        {/* Subsection C: Best Kids Bike */}
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Best Kids Bike</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {lang === "zh" ? "精选 12-16 英寸高安全评分儿童自行车，严苛测试制动距离与车架刚度。" : "Curated 12-16 inch kids bike models. Rigorously tested for pedal stability, frame geometry and stopping power."}
              </p>
            </div>
            <a
              href="/guides/best"
              onClick={(e) => {
                e.preventDefault();
                localStorage.setItem("selectedCategory", "best");
                localStorage.setItem("autoSelectWizardCategory", "bicycle");
                if ((window as any).navigateToPath) {
                  (window as any).navigateToPath("/guides/best");
                  // Trigger category synchronizer
                  if (typeof (window as any).setActiveGuidesCategory === "function") {
                    (window as any).setActiveGuidesCategory("best");
                  }
                } else {
                  setActiveTab("guides");
                }
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors shrink-0 uppercase tracking-widest pl-4 flex items-center gap-1.5"
            >
              <span>{lang === "zh" ? "更多精选推荐" : "More Picks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kidsBikeProducts.map((p, idx) => renderProductCard(p, idx + 2))}
          </div>
        </div>

        {/* Subsection D: Best Kids Scooter */}
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Best Kids Scooter</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {lang === "zh" ? "针对幼童与大童的防翻侧滑板车评测，重点聚焦重力转向及防空转安全垫片。" : "Robust safety evaluations on stability and lean-to-steer mechanisms. We audit deck strength and steering response."}
              </p>
            </div>
            <a
              href="/guides/best"
              onClick={(e) => {
                e.preventDefault();
                localStorage.setItem("selectedCategory", "best");
                localStorage.setItem("autoSelectWizardCategory", "scooter");
                if ((window as any).navigateToPath) {
                  (window as any).navigateToPath("/guides/best");
                  // Trigger category synchronizer
                  if (typeof (window as any).setActiveGuidesCategory === "function") {
                    (window as any).setActiveGuidesCategory("best");
                  }
                } else {
                  setActiveTab("guides");
                }
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors shrink-0 uppercase tracking-widest pl-4 flex items-center gap-1.5"
            >
              <span>{lang === "zh" ? "更多精选推荐" : "More Picks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kidsScooterProducts.map((p, idx) => renderProductCard(p, idx + 3))}
          </div>
        </div>

        {/* Subsection E: Best Kids Electric Car */}
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Best Kids Electric Car</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {lang === "zh" ? "全方位儿童电动遥控模拟舱测试，着重实测双向避震、缓启冲阻性及电池管理系统。" : "Comprehensive evaluations on interactive dual-drive simulation cabins. We audit suspension, smooth start control, and battery cell reliability."}
              </p>
            </div>
            <a
              href="/guides/best"
              onClick={(e) => {
                e.preventDefault();
                localStorage.setItem("selectedCategory", "best");
                localStorage.setItem("autoSelectWizardCategory", "electric_vehicles");
                if ((window as any).navigateToPath) {
                  (window as any).navigateToPath("/guides/best");
                  if (typeof (window as any).setActiveGuidesCategory === "function") {
                    (window as any).setActiveGuidesCategory("best");
                  }
                } else {
                  setActiveTab("guides");
                }
              }}
              className="text-xs font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors shrink-0 uppercase tracking-widest pl-4 flex items-center gap-1.5"
            >
              <span>{lang === "zh" ? "更多精选推荐" : "More Picks"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kidsElectricCarProducts.length > 0 ? (
              kidsElectricCarProducts.map((p, idx) => renderProductCard(p, idx + 4))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-3xl">
                {lang === "zh" ? "暂无电动车评测数据，敬请期待" : "No electric car evaluation data available yet."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Buying Guide Quick Links (选购指南快捷入口) */}
      <section id="quick_scenarios_anchor" className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "智能选购场景" : "Quick Selection Scenarios"}</h3>
            <p className="text-slate-500 font-medium">{lang === "zh" ? "从成长阶段出发，为您快速匹配最佳方案。" : "Find the perfect match based on your child's growth stage."}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: "newborn", label: lang === "zh" ? "新生儿(0-12月) · 出行安全" : "Newborn Mobility", desc: lang === "zh" ? "侧重减震与中轴枢纽强度" : "Focus on shock absorption" },
              { id: "outdoor", label: lang === "zh" ? "户外郊游 · 越野专家" : "Outdoor Experts", desc: lang === "zh" ? "轮组抓地力与通过性专项评测" : "Grip and terrain testing" },
              { id: "commute", label: lang === "zh" ? "日常通勤 · 轻便首选" : "Daily Commute", desc: lang === "zh" ? "折叠速度与整备质量极限对比" : "Weight and folding speed" },
            ].map(scene => (
              <div key={scene.id} onClick={() => setActiveTab("guides")} className="p-8 bg-white border border-slate-100 rounded-4xl hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer group">
                <h4 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors mb-2">{scene.label}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{scene.desc}</p>
              </div>
            ))}
          </div>
      </section>

      {/* 7. FAQ Section (手风琴常见问题解答) */}
      <section id="faq_section_anchor" className="max-w-4xl mx-auto px-6 space-y-10 py-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "常见问题" : "FAQ"}</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {lang === "zh" ? "常见选购与测试解答" : "Frequently Asked Questions"}
          </h2>
          <p className="text-slate-500 font-medium">
            {lang === "zh" ? "为您解答关于慢跑婴儿车、平衡车与儿童自行车测试标准的常见问题。" : "Answering your questions on kids mobility testing standards and safe selection guidelines."}
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: lang === "zh" ? "KIDSMOBI 如何测试慢跑手推车的安全性？" : "How does KIDSMOBI test jogging strollers for safety?",
              a: lang === "zh" ? "我们对全地形悬挂系统、轮轴轴承强度和动态负载下的刹车可靠性进行严苛的物理测试，确保跑步过程中的儿童舒适性与极致保护。" : "We perform rigorous physical audits on all-terrain suspension, wheel-bearing strength, and braking reliability under dynamic loads to ensure ultimate child comfort and protection during runs."
            },
            {
              q: lang === "zh" ? "孩子几岁开始骑平衡车最合适？" : "What is the best age for a child to start using a balance bike?",
              a: lang === "zh" ? "孩子最早可在 18 个月大时开始尝试。我们聚焦于超轻量化车架、低座高设计和稳定的转向几何，帮助幼童建立自我平衡的信心。" : "Children can start as early as 18 months. We focus on lightweight frames, low seat heights, and stable steering geometry to help toddlers build self-balancing confidence."
            },
            {
              q: lang === "zh" ? "三轮滑板车对幼童来说比两轮更安全吗？" : "Are 3-wheel scooters safer than 2-wheelers for toddlers?",
              a: lang === "zh" ? "是的，三轮滑板车的 lean-to-steer（倾斜重力转向）能防止紧急翻侧，并为幼儿提供极佳的横向稳定性。我们专门测试脚踏板强度与转向响应度。" : "Yes, lean-to-steer features on 3-wheel scooters prevent sudden flips and provide strong lateral stability for toddlers. We test deck resilience and steering responsiveness."
            },
            {
              q: lang === "zh" ? "儿童自行车的核心安全标准是什么？" : "What are the key safety standards for kids' bikes?",
              a: lang === "zh" ? "所有车辆都必须符合 EN 71、ISO 8098 或 ASTM F963 等标准。我们实测链条罩安全性、制动锁死刹车距离、手把防护罩以及车架结构强度。" : "Every bike must comply with EN 71, ISO 8098, or ASTM F963 standards. We verify chain guard safety, braking locking distance, handle grip protection, and structural frame stiffness."
            },
            {
              q: lang === "zh" ? "为什么客观中立的第三方评测对家长的选购决策至关重要？" : "Why are neutral third-party reviews critical for parent decision-making?",
              a: lang === "zh" ? "KIDSMOBI 不接受任何厂商赞助与竞选曝光收费。我们坚持独立评估，将科学层面的机械力学数据转化为值得信赖的买家购买信心。" : "KIDSMOBI accepts zero merchant sponsorship or paid placements. We test models independently, transforming scientific mechanical data into reliable parent buying confidence."
            }
          ].map((item, idx) => (
            <div key={idx} className="border border-slate-100 bg-white rounded-3xl overflow-hidden transition-all hover:border-slate-200">
              <button
                onClick={() => handleFaqToggle(idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-black text-slate-800 text-sm md:text-base">{item.q}</span>
                <span className="transform transition-transform duration-300 text-slate-400">
                  {openFaqIndex === idx ? (
                    <span className="text-xl inline-block rotate-45 text-orange-500 font-bold">＋</span>
                  ) : (
                    <span className="text-xl inline-block text-slate-400">＋</span>
                  )}
                </span>
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openFaqIndex === idx ? "max-h-60 border-t border-slate-50" : "max-h-0"
                }`}
              >
                <div className="p-6 text-sm text-slate-500 font-medium leading-relaxed bg-slate-50/50">
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MatchingWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        productsData={productsData}
        onSelectProduct={(p) => {
          setIsWizardOpen(false);
          onSelectProduct(p);
        }}
        lang={lang}
        currencyData={currencyData}
      />
    </div>
  );
}
