/**
 * Utility for handling metric & imperial conversions based on country/region code.
 */

export type UnitSystem = "metric" | "imperial";

export function getUnitSystem(countryCode: string): UnitSystem {
  // US and GB use imperial by default, others use metric
  if (countryCode === "US" || countryCode === "GB") {
    return "imperial";
  }
  return "metric";
}

export function getWeightUnit(countryCode: string): string {
  return getUnitSystem(countryCode) === "imperial" ? "lbs" : "kg";
}

export function getHeightUnit(countryCode: string): string {
  return getUnitSystem(countryCode) === "imperial" ? "in." : "cm";
}

/**
 * Returns raw converted value (e.g. kg to lbs)
 */
export function convertWeightNum(kg: number, countryCode: string): number {
  if (getUnitSystem(countryCode) === "imperial") {
    return kg * 2.20462;
  }
  return kg;
}

/**
 * Returns raw converted value (e.g. cm to inches)
 */
export function convertHeightNum(cm: number, countryCode: string): number {
  if (getUnitSystem(countryCode) === "imperial") {
    return cm / 2.54;
  }
  return cm;
}

/**
 * Formats a weight value based on the country code.
 */
export function formatWeight(kg: number, countryCode: string): string {
  const isImperial = getUnitSystem(countryCode) === "imperial";
  if (isImperial) {
    const lbs = kg * 2.20462;
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

/**
 * Formats a height/inseam value based on the country code.
 */
export function formatHeight(cm: number, countryCode: string): string {
  const isImperial = getUnitSystem(countryCode) === "imperial";
  if (isImperial) {
    const inches = cm / 2.54;
    return `${inches.toFixed(1)} in.`;
  }
  return `${cm.toFixed(0)} cm`;
}
