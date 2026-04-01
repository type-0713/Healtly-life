export const UZBEKISTAN_REGIONS = [
  "Qoraqalpog'iston Respublikasi",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg'ona viloyati",
  "Jizzax viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
  "Toshkent viloyati",
  "Toshkent shahri",
  "Xorazm viloyati",
] as const;

export const ALL_REGIONS_OPTION = "Barcha viloyatlar";

type RegionName = (typeof UZBEKISTAN_REGIONS)[number];

const normalizeRegionText = (value: string) =>
  value
    .toLowerCase()
    .replace(/['`’ʻ]/g, "")
    .replace(/sh\./g, "shahri")
    .replace(/vil\./g, "viloyati")
    .replace(/\s+/g, " ")
    .trim();

const regionAliases: Record<RegionName, string[]> = {
  "Qoraqalpog'iston Respublikasi": ["qoraqalpogiston", "karakalpakstan", "nukus"],
  "Andijon viloyati": ["andijon", "andijan"],
  "Buxoro viloyati": ["buxoro", "bukhara"],
  "Farg'ona viloyati": ["fargona", "fergana"],
  "Jizzax viloyati": ["jizzax", "jizzakh"],
  "Namangan viloyati": ["namangan"],
  "Navoiy viloyati": ["navoiy", "navoi"],
  "Qashqadaryo viloyati": ["qashqadaryo", "qarshi", "kashkadarya"],
  "Samarqand viloyati": ["samarqand", "samarkand"],
  "Sirdaryo viloyati": ["sirdaryo", "guliston", "syrdarya"],
  "Surxondaryo viloyati": ["surxondaryo", "termiz", "surkhandarya"],
  "Toshkent viloyati": ["toshkent viloyati", "tashkent region", "chirchiq", "angren"],
  "Toshkent shahri": ["toshkent shahri", "toshkent shahar", "tashkent city", "tashkent"],
  "Xorazm viloyati": ["xorazm", "urgench", "khorezm"],
};

export const isUzbekRegion = (value: string): value is RegionName =>
  UZBEKISTAN_REGIONS.includes(value as RegionName);

export const resolveUzbekRegion = (value: string) => {
  const normalizedValue = normalizeRegionText(value);

  if (!normalizedValue) {
    return "";
  }

  const exactMatch = UZBEKISTAN_REGIONS.find(
    (region) => normalizeRegionText(region) === normalizedValue,
  );

  if (exactMatch) {
    return exactMatch;
  }

  return (
    UZBEKISTAN_REGIONS.find((region) =>
      regionAliases[region].some((alias) => normalizedValue.includes(normalizeRegionText(alias))),
    ) ?? ""
  );
};

export const inferUzbekRegion = (...parts: Array<string | undefined>) => {
  const joinedText = normalizeRegionText(parts.filter(Boolean).join(" "));
  return resolveUzbekRegion(joinedText);
};
