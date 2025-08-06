"use client";

import { getEnrichedPortfolioData } from "@/utils/loadData";
import { useEffect, useState, useMemo } from "react";
import { Portfolio } from "@/types/portfolio";
import PortfolioCard from "@/components/PortfolioCard";

export default function Dashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetch("/api/yahoo"), fetch("/api/google")]);
      const data = getEnrichedPortfolioData();
      setPortfolios(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const cmpInterval = setInterval(refreshData, 15000);
    return () => clearInterval(cmpInterval);
  }, []);

  const portfolio = portfolios[0];

  const sectors = useMemo(() => {
    if (!portfolio) return [];

    const sectorSummary: Record<
      string,
      { investment: number; presentValue: number; gainLoss: number }
    > = {};

    portfolio.holdings.forEach((h) => {
      const sector = h.sector || "Uncategorized";
      if (!sectorSummary[sector]) {
        sectorSummary[sector] = { investment: 0, presentValue: 0, gainLoss: 0 };
      }
      sectorSummary[sector].investment += h.investment || 0;
      sectorSummary[sector].presentValue += h.presentValue || 0;
      sectorSummary[sector].gainLoss += h.gainLoss || 0;
    });

    const totalInvestment = portfolio.totalInvestment ?? 0;
    const totalPresentValue = portfolio.totalPresentValue ?? 0;
    const totalGainLoss = portfolio.totalGainLoss ?? 0;

    return Object.entries(sectorSummary).map(([sector, values]) => {
      const percent = totalInvestment
        ? (values.investment / totalInvestment) * 100
        : 0;

      return {
        sector,
        investment: values.investment,
        presentValue: values.presentValue,
        gainLoss: values.gainLoss,
        percent,
        totalInvestment,
        totalPresentValue,
        totalGainLoss,
        sectorPercent: percent,
      };
    });
  }, [portfolio]);

  // ✅ Now we can conditionally return safely
  if (portfolios.length === 0)
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span className="ml-3 text-gray-700 text-lg">Loading...</span>
      </div>
    );

  return (
    <div>
      {/* ✅ reusable component */}
      <PortfolioCard portfolio={{ ...portfolio, sectors }} />
    </div>
  );
}
