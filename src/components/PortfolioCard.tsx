"use client";

import { useEffect, useState } from "react";
import { EnrichedPortfolio } from "@/types/portfolio";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioTable from "@/components/PortfolioTable";
import PortfolioSunburst from "@/components/PortfolioSunburst";
import { buildSunburstData, getTopGainersAndLosers } from "@/utils/chartUtils";
import PortfolioGainLossBar from "@/components/PortfolioGainLossBar";

export default function PortfolioCard({ portfolio }: { portfolio: EnrichedPortfolio }) {
  // ✅ Top 3 gainers + losers by stock
  const topHoldings = getTopGainersAndLosers(
    portfolio.holdings,
    (h) => h.gainLossPercent ?? 0,
    (h) => h.particulars
  );

  // ✅ expand/collapse sector state
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
<div className="bg-white shadow-xl rounded-2xl p-6 mb-6 w-full">
  <h2 className="text-xl font-bold mb-4">{portfolio.portfolioName}</h2>

  {/* 🔳 Top Charts Row */}
  <div className="flex flex-col lg:flex-row gap-4 ">
    {/* Summary (40%) */}
    <div className="basis-[40%] min-h-[240px] flex flex-col justify-between">
      <PortfolioSummary portfolio={portfolio} />
    </div>

    {/* Gain/Loss Bar (30%) */}
    <div className="basis-[30%] min-h-[240px] flex flex-col justify-between">
      <PortfolioGainLossBar
        title="Highest & Lowest ROI Assets"
        holdings={portfolio.holdings}
      />
    </div>

    {/* Sunburst (30%) */}
    <div className="basis-[30%] min-h-[240px] flex flex-col justify-between">
      <PortfolioSunburst data={buildSunburstData(portfolio)} />
    </div>
  </div>

  {/* 📋 Table */}
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



