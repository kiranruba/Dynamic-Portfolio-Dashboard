import { Portfolio } from "@/types/portfolio";


export function buildSunburstData(portfolio: Portfolio) {
  const sectorMap: Record<string, any> = {};

  portfolio.holdings.forEach((h) => {
    const sectorKey = h.sector || "Uncategorized";
    const stockLabel = h.particulars ||h.holdingId ;

    if (!sectorMap[sectorKey]) {
      sectorMap[sectorKey] = {
        name: sectorKey,
        children: [],
      };
    }

    sectorMap[sectorKey].children.push({
      name: stockLabel,
      value: h.presentValue ?? 0,
    });
  });

  return {
    name: "Portfolio",
    children: Object.values(sectorMap),
  };
}

export function getTopGainersAndLosers<T>(
  items: T[],
  valueGetter: (item: T) => number,
  labelGetter: (item: T) => string
) {
  // sort by gainLoss value descending
  const sorted = [...items].sort((a, b) => valueGetter(b) - valueGetter(a));

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

  return [...top3, ...bottom3].map((item) => ({
    label: labelGetter(item),
    gainLoss: valueGetter(item),
  }));
}