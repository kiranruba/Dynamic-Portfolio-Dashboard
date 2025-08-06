import portfoliosRaw from "@/data/portfolios.json";
import assetsRaw from "@/data/assets.json";
import usersRaw from "@/data/users.json";
import { Portfolio, Holding } from "@/types/portfolio";

// Cast JSON to expected types
const portfolios = portfoliosRaw as Portfolio[];
const assets = assetsRaw as {
  holdingId: string;
  particulars: string;
  sector: string;
  marketData: {
    cmp: number;
    pe: number | null;
    marketCap: number | null;
    latestEarnings: number | null;
  };
}[];
const users = usersRaw;
export interface EnrichedHolding extends Holding {
  sector: string;
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
}
export const getUsers = () => users;
export const getPortfolios = (): Portfolio[] => portfolios;
export const getAssets = () => assets;

export const getEnrichedPortfolioData = (): (Portfolio & { sectors: any[] })[] => {
  return portfolios.map((portfolio) => {
    let totalInvestment = 0;
    let totalPresentValue = 0;

    const enrichedHoldings: EnrichedHolding[] = portfolio.holdings.map((holding) => {
      const assetData = assets.find(
        (asset) => asset.holdingId === holding.holdingId
      );

      const cmp = assetData?.marketData.cmp || 0;
      const investment = holding.purchasePrice * holding.purchaseQty;
      const presentValue = cmp * holding.purchaseQty;
      const gainLoss = presentValue - investment;
      const gainLossPercent =
        investment !== 0 ? (gainLoss / investment) * 100 : 0;

      totalInvestment += investment;
      totalPresentValue += presentValue;

      return {
        ...holding,
        particulars: assetData?.particulars || "",
        sector: assetData?.sector || "",
        cmp,
        pe: assetData?.marketData.pe || 0,
        marketCap: assetData?.marketData.marketCap || 0,
        latestEarnings: assetData?.marketData.latestEarnings || 0,
        investment,
        presentValue,
        holdingId: holding.holdingId,
        gainLoss,
        gainLossPercent,
        portfolioPercent: 0,
      };
    });

    const totalGainLoss = totalPresentValue - totalInvestment;

    // Add portfolio percentage for each holding
    const holdingsWithPercent: EnrichedHolding[] = enrichedHoldings.map((h) => ({
      ...h,
      portfolioPercent:
        totalInvestment !== 0 ? (h.investment / totalInvestment) * 100 : 0,
    }));

      // ✅ Sector Aggregation
    const sectorSummary: Record<string, any> = {};
    holdingsWithPercent.forEach((h) => {
      if (!sectorSummary[h.sector]) {
        sectorSummary[h.sector] = {
          sector: h.sector,
          totalInvestment: 0,
          totalPresentValue: 0,
          totalGainLoss: 0,
        };
      }
      sectorSummary[h.sector].totalInvestment += h.investment;
      sectorSummary[h.sector].totalPresentValue += h.presentValue;
      sectorSummary[h.sector].totalGainLoss += h.gainLoss;
    });

    const sectors = Object.values(sectorSummary).map((s: any) => ({
      ...s,
      sectorPercent:
        totalInvestment !== 0
          ? (s.totalInvestment / totalInvestment) * 100
          : 0,
    }));


    return {
      ...portfolio,
      holdings: holdingsWithPercent,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      sectors, 
    };
  });
};
