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
import { getPageCopy } from "../config/pageCopy";

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
  electric_vehicles: "https://store.balancebiketoddler.com/electric_vehicles/ANPABO/Rank_6_ASIN_B0FSS9PR84_ANPABO%20Licensed%20Ford%20F-150%2024V%202%20Seater%20Ride%20on%20Ca/images/primary.jpg",
  car_seat: "https://store.balancebiketoddler.com/car_seat/Graco/Rank_1_ASIN_B0DHLQMWW7_Graco%20Extend2Fit%20Convertible%20Car%20Seat%20Rear%20and%20For/images/primary.jpg",
};

const HOME_CARD_DEFAULT_IMAGES = [
  JOGGER_STROLLER_DEFAULT_IMAGE,
  BALANCE_BIKE_DEFAULT_IMAGE,
  KIDS_BIKE_CATEGORY_DEFAULT_IMAGE,
  SCOOTER_DEFAULT_IMAGE,
];

function compactSnippet(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function pickCustomersSay(product: Product, lang: "zh" | "en"): string {
  const localized = (product as Product & {
    zh?: { customersSay?: string };
    en?: { customersSay?: string };
  })[lang]?.customersSay;
  return compactSnippet(localized || product.customers_say || product.customersSay || "");
}

function isRatingStatsSummary(value: string): boolean {
  const text = compactSnippet(value).toLowerCase();
  if (!text) return true;
  return (
    /^rated\s+\d(?:\.\d+)?\s+out\s+of\s+5\b/.test(text) ||
    /^backed\s+by\s+[\d,]+\s+customer\s+reviews\b/.test(text) ||
    /^\d(?:\.\d+)?\s+\d(?:\.\d+)?\s+out\s+of\s+5\s+stars\b/.test(text) ||
    /^\(?[\d,]+\)?\s+customer\s+reviews\b/.test(text)
  );
}

function hasRealCustomersSay(product: Product, lang: "zh" | "en"): boolean {
  const customerSay = pickCustomersSay(product, lang);
  if (!customerSay || isRatingStatsSummary(customerSay)) return false;
  return /^Customers find\b/i.test(customerSay);
}

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
    double_stroller: ["double_stroller", "twin stroller"],
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
  const pageCopy = getPageCopy(lang);
  const homeCopy = pageCopy.home;
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
      return homeCopy.runtimeLabels.categoryNames.joggingStroller;
    }
    if (searchable.includes("balance_bike") || (searchable.includes("balance") && !searchable.includes("tricycle"))) {
      return homeCopy.runtimeLabels.categoryNames.balanceBike;
    }
    if (
      searchable.includes("kids_bikes") ||
      searchable.includes("tricycle") ||
      searchable.includes("trike") ||
      (searchable.includes("bike") && !searchable.includes("balance"))
    ) {
      return homeCopy.runtimeLabels.categoryNames.kidsBike;
    }
    if (
      searchable.includes("electric_vehicles") ||
      searchable.includes("electric_car") ||
      searchable.includes("electric_vehicle") ||
      searchable.includes("electric_toy") ||
      searchable.includes("battery_powered") ||
      searchable.includes("ev")
    ) {
      return homeCopy.runtimeLabels.categoryNames.kidsElectricCar;
    }
    if (searchable.includes("scooter")) {
      return homeCopy.runtimeLabels.categoryNames.kidsScooter;
    }
    if (searchable.includes("stroller")) {
      return homeCopy.runtimeLabels.categoryNames.stroller;
    }
    return homeCopy.runtimeLabels.categoryNames.featuredProduct;
  };

  const resolveHomepageProductTitle = (product?: Product, forcedCategoryLabel?: string) => {
    if (!product) return homeCopy.runtimeLabels.evaluating;
    const localized = translateProduct(product, lang);
    const brand = String(localized.brand || product.brand || "").trim();
    const categoryLabel = forcedCategoryLabel || resolveHomepageCategoryLabel(product);
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
      // Exception: Allow genuine jogger_stroller products to retain their images/ranks
      const isGenuineJogger = normalizeCategory((product as any).categoryId || "") === "jogger_stroller";
      if (mediaCandidates.some((value) => value.includes("rank_similar_")) && !isGenuineJogger) {
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
    const homepageToPageCatIdMap: Record<string, string> = {
      stroller: "stroller",
      balance_bike: "balance_bike",
      kids_bikes: "kids_bikes",
      scooters: "kids_scooters",
      electric_vehicles: "electric_vehicles",
      car_seat: "car_seat",
    };

    const getProductPageCategoryId = (product: Product): string => {
      const raw = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
      const localAliasMap: Record<string, string> = {
        scooters: "kids_scooters",
        scooter: "kids_scooters",
        balance: "balance_bike",
        "balance bike": "balance_bike",
        bicycle: "kids_bikes",
        tricycle: "kids_tricycles",
        electric_car: "electric_vehicles",
        safety_seat: "car_seat",
      };
      const normalized = localAliasMap[raw] || raw;
      
      if (normalized !== "stroller") return normalized;

      const text = [
        product.name,
        (product as any)?.title,
        product.description,
        (product as any)?.zh?.description,
        (product as any)?.en?.description,
      ]
        .map((item) => String(item || "").toLowerCase())
        .join(" ");

      const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
      const hasCarSeatSignal = /(\bcar\s*seat\b|\bbooster\s*seat\b|\bconvertible\s*car\s*seat\b|\binfant\s*car\s*seat\b|安全座椅|提篮座椅)/i.test(text);

      if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";

      return normalized;
    };

    for (const entry of SCRAPED_CATEGORY_CATALOG) {
      const targetPageCatId = homepageToPageCatIdMap[entry.id] || entry.id;
      const candidates = homeVisualProducts.filter((product) => {
        const prodCatId = getProductPageCategoryId(product);
        return prodCatId === targetPageCatId;
      });

      // Sort exactly like the product category list page (by hasRealCustomersSay first, then by overallScore descending)
      const sorted = [...candidates].sort((a, b) => {
        const customerSayDelta = Number(hasRealCustomersSay(b, lang)) - Number(hasRealCustomersSay(a, lang));
        if (customerSayDelta !== 0) return customerSayDelta;
        return (b.overallScore || 0) - (a.overallScore || 0);
      });

      const found = sorted[0];
      if (found) {
        map[entry.id] = found;
      }
    }
    return map;
  }, [homeVisualProducts, lang]);

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
    const labelOverrides: Record<string, string> = {
      stroller: homeCopy.categoryCards.strollerLabel,
      balance_bike: homeCopy.categoryCards.balanceLabel,
      kids_bikes: homeCopy.categoryCards.kidsBikeLabel,
      scooters: homeCopy.categoryCards.scooterLabel,
      electric_vehicles: homeCopy.categoryCards.electricCarLabel,
      car_seat: homeCopy.categoryCards.carSeatLabel,
    };
    const descOverrides: Record<string, string> = {
      stroller: homeCopy.categoryCards.strollerDesc,
      balance_bike: homeCopy.categoryCards.balanceDesc,
      kids_bikes: homeCopy.categoryCards.kidsBikeDesc,
      scooters: homeCopy.categoryCards.scooterDesc,
      electric_vehicles: homeCopy.categoryCards.electricCarDesc,
      car_seat: homeCopy.categoryCards.carSeatDesc,
    };

    const targetOrder = ["stroller", "balance_bike", "kids_bikes", "scooters", "electric_vehicles", "car_seat"];
    return targetOrder.map(id => {
      const entry = SCRAPED_CATEGORY_CATALOG.find(c => c.id === id);
      if (!entry) return null;
      return {
        ...entry,
        label: labelOverrides[id] || (lang === "zh" ? entry.zh : entry.en),
        desc: descOverrides[id] || "",
        slug: `/products/${id === "scooters" ? "kids_scooters" : id}`,
      };
    }).filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [homeCopy.categoryCards, lang]);

  const strollerProducts = useMemo(() => {
    const strollers = homeVisualProducts.filter((product) => {
      const normalizedCategoryId = normalizeCategory((product as any).categoryId || "");
      const normalizedCategory = normalizeCategory(product.category || "");
      return normalizedCategoryId === "jogger_stroller" || normalizedCategory === "jogger_stroller";
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
      const normalizedCategoryId = normalizeCategory(String((product as any).categoryId || ""));
      const normalizedCategory = normalizeCategory(String(product.category || ""));
      const searchable = normalizeCategory(`${normalizedCategory} ${normalizedCategoryId} ${product.name || ""}`);

      const isKidsBikeCategory =
        normalizedCategoryId === "kids_bikes" ||
        normalizedCategoryId === "kids_bike" ||
        normalizedCategory === "kids_bikes" ||
        normalizedCategory === "bicycle";

      const hasTricycleSignal = searchable.includes("tricycle") || searchable.includes("trike") || searchable.includes("kids_tricycles");
      const hasBalanceSignal = searchable.includes("balance") || searchable.includes("balance_bike");
      const hasElectricSignal =
        searchable.includes("electric_vehicles") ||
        searchable.includes("electric_car") ||
        searchable.includes("electric_vehicle") ||
        searchable.includes("electric_toy") ||
        searchable.includes("battery_powered") ||
        searchable.includes("ev");
      const hasOtherCategorySignal =
        searchable.includes("scooter") ||
        searchable.includes("scooters") ||
        searchable.includes("stroller") ||
        searchable.includes("jogger");

      const hasBikeSignal = searchable.includes("kids_bikes") || searchable.includes("kids_bike") || searchable.includes("bike");
      return (isKidsBikeCategory || hasBikeSignal) && !hasTricycleSignal && !hasBalanceSignal && !hasElectricSignal && !hasOtherCategorySignal;
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
      const normalizedCategoryId = normalizeCategory(String((product as any).categoryId || ""));
      const normalizedCategory = normalizeCategory(String(product.category || ""));
      const searchable = normalizeCategory(`${normalizedCategory} ${normalizedCategoryId} ${product.name || ""}`);

      const isElectricCategory =
        normalizedCategoryId === "electric_vehicles" ||
        normalizedCategoryId === "electric_car" ||
        normalizedCategory === "electric_car";

      const hasScooterSignal = searchable.includes("scooter") || searchable.includes("scooters") || searchable.includes("kids_scooters");
      const hasClassicTricycleOrBike =
        searchable.includes("tricycle") ||
        searchable.includes("trike") ||
        searchable.includes("kids_bikes") ||
        (searchable.includes("bike") && !searchable.includes("electric"));

      return isElectricCategory && !hasScooterSignal && !hasClassicTricycleOrBike;
    });
    return [...cars].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0)).slice(0, 4);
  }, [homeVisualProducts]);

  const renderProductCard = (p: Product, idx: number, forcedCategoryLabel?: string) => {
    const dp = translateProduct(p, lang);
    const title = resolveHomepageProductTitle(p, forcedCategoryLabel);
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
                      {homeCopy.runtimeLabels.fallbackActive}
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
      name: homeCopy.runtimeLabels.jsonLdHomeName,
      url: canonicalUrl,
      items: homepageItems,
    });

    // 动态注入 FAQPage 模型，助力 Google Rich Snippets 提取
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": homeCopy.faq.items.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer,
        },
      }))
    };
    setJsonLd("home-faq", faqSchema);

    return () => {
      clearJsonLd("home-list");
      clearJsonLd("home-faq");
    };
  }, [homeCopy.faq.items, homeCopy.runtimeLabels.jsonLdHomeName, lang, topSelections, prioritizedCategoryCards]);

  return (
    <div id="home_layout" className="space-y-24 pb-20">
      {isBBTTheme && (
        <Breadcrumbs
          lang={lang}
          onHomeClick={() => setActiveTab("home")}
          items={[{ label: homeCopy.overviewLabel, active: true }]}
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
            {homeCopy.bannerBadge}
          </div>
          
          <h1 className="km-page-title text-white max-w-5xl mx-auto drop-shadow-md">
            {homeCopy.heroTitle}
          </h1>
          
          <p className="km-body-copy text-slate-200 text-sm md:text-base max-w-3xl mx-auto font-semibold drop-shadow-sm">
            {homeCopy.heroSubtitle}
          </p>

          <div className="pt-4 pb-2">
            <button
              onClick={() => setActiveTab("guides")}
              className="inline-flex items-center gap-3 px-10 py-5 bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
              {homeCopy.heroCta}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-white/10">
            {[
              { id: "kids_bikes", label: homeCopy.quickCategories.kidsBike, icon: Bike },
              { id: "balance_bike", label: homeCopy.quickCategories.balanceBike, icon: Smile },
              { id: "scooters", label: homeCopy.quickCategories.kidsScooter, icon: Sparkles },
              { id: "stroller", label: homeCopy.quickCategories.joggingStroller, icon: Footprints },
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
              {homeCopy.categoryHighlights.eyebrow}
            </span>
            <h2 className="km-section-title text-slate-900">
              {homeCopy.categoryHighlights.title}
            </h2>
            <p className="km-heading-copy km-body-copy text-slate-500 font-medium">
              {homeCopy.categoryHighlights.description}
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
            {homeCopy.categoryHighlights.openProductCenter}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const topProduct = categoryTopProductMap[cat.id];
                  if (topProduct) {
                    onSelectProduct(topProduct);
                    return;
                  }
                  onSelectCategory(cat.id);
                }}
                className="relative h-52 w-full bg-slate-50 overflow-hidden text-center cursor-pointer"
                aria-label={lang === "zh" ? `${cat.label} 详情` : `${cat.label} details`}
              >
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
                  {homeCopy.categoryHighlights.featuredTag}
                </span>
              </button>

              <div className="p-6 bg-white flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <h3 className="km-card-title text-slate-950">{cat.label}</h3>
                  <p className="km-heading-copy km-body-copy text-xs text-slate-500 font-medium">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-4">
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
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{homeCopy.safetyAudits.badge}</span>
            <h2 className="km-section-title text-slate-900">{homeCopy.safetyAudits.title}</h2>
            <p className="km-heading-copy km-body-copy text-slate-500 font-medium">
              {homeCopy.safetyAudits.description}
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
            {homeCopy.safetyAudits.viewAudits} <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Subsection A: Best Jogging Stroller */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{homeCopy.safetyAudits.sections.joggingTitle}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {homeCopy.safetyAudits.sections.joggingDesc}
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
                <span>{homeCopy.safetyAudits.morePicks}</span>
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
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{homeCopy.safetyAudits.sections.balanceTitle}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {homeCopy.safetyAudits.sections.balanceDesc}
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
                <span>{homeCopy.safetyAudits.morePicks}</span>
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
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{homeCopy.safetyAudits.sections.kidsBikeTitle}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {homeCopy.safetyAudits.sections.kidsBikeDesc}
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
                <span>{homeCopy.safetyAudits.morePicks}</span>
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
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{homeCopy.safetyAudits.sections.scooterTitle}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {homeCopy.safetyAudits.sections.scooterDesc}
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
                <span>{homeCopy.safetyAudits.morePicks}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kidsScooterProducts.map((p, idx) => renderProductCard(p, idx + 3, homeCopy.runtimeLabels.categoryNames.kidsScooter))}
          </div>
        </div>

        {/* Subsection E: Best Kids Electric Car */}
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center border-l-4 border-orange-500 pl-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{homeCopy.safetyAudits.sections.electricCarTitle}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                {homeCopy.safetyAudits.sections.electricCarDesc}
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
                <span>{homeCopy.safetyAudits.morePicks}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kidsElectricCarProducts.length > 0 ? (
              kidsElectricCarProducts.map((p, idx) => renderProductCard(p, idx + 4))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-3xl">
                {homeCopy.safetyAudits.noElectricData}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Buying Guide Quick Links (选购指南快捷入口) */}
      <section id="quick_scenarios_anchor" className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <h2 className="km-section-title text-slate-900">{homeCopy.quickScenarios.title}</h2>
            <p className="km-heading-copy km-body-copy text-slate-500 font-medium">{homeCopy.quickScenarios.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: "newborn", label: homeCopy.quickScenarios.cards.newbornLabel, desc: homeCopy.quickScenarios.cards.newbornDesc },
              { id: "outdoor", label: homeCopy.quickScenarios.cards.outdoorLabel, desc: homeCopy.quickScenarios.cards.outdoorDesc },
              { id: "commute", label: homeCopy.quickScenarios.cards.commuteLabel, desc: homeCopy.quickScenarios.cards.commuteDesc },
            ].map(scene => (
              <div key={scene.id} onClick={() => setActiveTab("guides")} className="p-8 bg-white border border-slate-100 rounded-4xl hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer group">
                <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{scene.label}</h3>
                <p className="km-heading-copy km-body-copy text-xs text-slate-500 font-medium">{scene.desc}</p>
              </div>
            ))}
          </div>
      </section>

      {/* 7. FAQ Section (手风琴常见问题解答) */}
      <section id="faq_section_anchor" className="max-w-4xl mx-auto px-6 space-y-10 py-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{homeCopy.faq.badge}</span>
          <h2 className="km-section-title text-slate-900">
            {homeCopy.faq.title}
          </h2>
          <h3 className="text-slate-500 font-medium text-base">
            {homeCopy.faq.description}
          </h3>
        </div>

        <div className="space-y-4">
          {homeCopy.faq.items.map((item, idx) => (
            <div key={idx} className="border border-slate-100 bg-white rounded-3xl overflow-hidden transition-all hover:border-slate-200">
              <button
                onClick={() => handleFaqToggle(idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
              >
                <h3 className="font-black text-slate-800 text-sm md:text-base flex-1">{item.question}</h3>
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
                  {item.answer}
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
