"use client";

import { useEffect, useState } from "react";
import { EnrichedPortfolio } from "@/types/portfolio";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioTable from "@/components/PortfolioTable";
import PortfolioSunburst from "@/components/PortfolioSunburst";
import { buildSunburstData } from "@/utils/chartUtils";
import PortfolioGainLossBar from "@/components/PortfolioGainLossBar";
import ThemeToggle from "./ThemeToggle";

export default function PortfolioCard({ portfolio }: { portfolio: EnrichedPortfolio }) {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && portfolio.holdings.length > 0) {
      const defaultState: Record<string, boolean> = {};
      portfolio.holdings.forEach((h) => {
        if (h.sector) defaultState[h.sector] = true;
      });
      setExpandedSectors(defaultState);
      setHasInitialized(true);
    }
  }, [hasInitialized, portfolio]);

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-xl dark:shadow-md dark:shadow-gray-800 rounded-2xl p-6 mb-6 w-full transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{portfolio.portfolioName}</h2>
        <ThemeToggle />
      </div>


      <div className="flex flex-col lg:flex-row gap-4">
        <div className="basis-[40%] min-h-[240px] flex flex-col justify-between">
          <PortfolioSummary portfolio={portfolio} />
        </div>
        <div className="basis-[30%] min-h-[240px] flex flex-col justify-between">
          <PortfolioGainLossBar
            title="Highest & Lowest ROI Assets"
            holdings={portfolio.holdings}
          />
        </div>
        <div className="basis-[30%] min-h-[240px] flex flex-col justify-between">
          <PortfolioSunburst data={buildSunburstData(portfolio)} />
        </div>
      </div>

      <div>
        <PortfolioTable
          portfolio={portfolio}
          expandedSectors={expandedSectors}
          setExpandedSectors={setExpandedSectors}
        />
      </div>
    </div>
  );
}
