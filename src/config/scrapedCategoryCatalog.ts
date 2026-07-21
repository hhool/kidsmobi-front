export interface ScrapedCategoryEntry {
  id: string;
  zh: string;
  en: string;
  itemCount: number;
  catalogUrl: string;
  pagesUrl: string;
}

export const SCRAPED_CATEGORY_CATALOG: ScrapedCategoryEntry[] = [
  {
    id: "stroller",
    zh: "婴儿推车",
    en: "Stroller",
    itemCount: 38,
    catalogUrl: "https://store.balancebiketoddler.com/stroller/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/stroller/pages/index.html",
  },
  {
    id: "double_stroller",
    zh: "双人推车",
    en: "Double Stroller",
    itemCount: 15,
    catalogUrl: "https://store.balancebiketoddler.com/double_stroller/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/double_stroller/pages/index.html",
  },
  {
    id: "jogger_stroller",
    zh: "慢跑推车",
    en: "Jogger Stroller",
    itemCount: 12,
    catalogUrl: "https://store.balancebiketoddler.com/jogger_stroller/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/jogger_stroller/pages/index.html",
  },
  {
    id: "balance_bike",
    zh: "平衡车",
    en: "Balance Bike",
    itemCount: 16,
    catalogUrl: "https://store.balancebiketoddler.com/balance_bike/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/balance_bike/pages/index.html",
  },
  {
    id: "kids_bikes",
    zh: "儿童自行车",
    en: "Kids Bikes",
    itemCount: 30,
    catalogUrl: "https://store.balancebiketoddler.com/kids_bikes/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/kids_bikes/pages/index.html",
  },
  {
    id: "scooters",
    zh: "儿童滑板车",
    en: "Scooters",
    itemCount: 32,
    catalogUrl: "https://store.balancebiketoddler.com/scooters/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/scooters/pages/index.html",
  },
  {
    id: "electric_vehicles",
    zh: "儿童电动车",
    en: "Kids Electric Car",
    itemCount: 17,
    catalogUrl: "https://store.balancebiketoddler.com/electric_vehicles/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/electric_vehicles/pages/index.html",
  },
  {
    id: "kids_tricycles",
    zh: "儿童三轮车",
    en: "Kids Tricycles",
    itemCount: 21,
    catalogUrl: "https://store.balancebiketoddler.com/kids_tricycles/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/kids_tricycles/pages/index.html",
  },
  {
    id: "car_seat",
    zh: "安全座椅",
    en: "Kids Car Seats",
    itemCount: 1,
    catalogUrl: "https://store.balancebiketoddler.com/car_seat/index.html",
    pagesUrl: "https://store.balancebiketoddler.com/car_seat/pages/index.html",
  },
];
