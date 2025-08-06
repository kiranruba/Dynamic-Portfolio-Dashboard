"use client";

import { Portfolio } from "@/types/portfolio";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";

interface Props {
  portfolio: Portfolio;
}

export default function PortfolioSummary({ portfolio }: Props) {
  const { totalInvestment = 0, totalPresentValue = 0, holdings = [] } = portfolio;

  const {
    gainLoss,
    gainLossPercent,
    gainColor,
    ArrowIcon,
    profitable,
    lossMakers,
    totalGains,
    totalLosses,
    gainPercent,
    lossPercent,
    topContributors,
    topContribPercent,
    topLosers,
    topLossPercent,
  } = useMemo(() => {
    const gainLoss = totalPresentValue - totalInvestment;
    const gainLossPercent = totalInvestment ? (gainLoss / totalInvestment) * 100 : 0;
    const gainColor = gainLoss >= 0 ? "text-green-600" : "text-red-600";
    const ArrowIcon = gainLoss >= 0 ? ArrowUpRight : ArrowDownRight;

    const profitable = holdings.filter(h => (h.gainLoss ?? 0) > 0);
    const lossMakers = holdings.filter(h => (h.gainLoss ?? 0) < 0);

    const totalGains = profitable.reduce((sum, h) => sum + (h.gainLoss || 0), 0);
    const totalLosses = lossMakers.reduce((sum, h) => sum + (h.gainLoss || 0), 0);

    const gainPercent = totalInvestment > 0 ? (totalGains / totalInvestment) * 100 : 0;
    const lossPercent = totalInvestment > 0 ? (totalLosses / totalInvestment) * 100 : 0;

    const gainers = [...profitable].sort((a, b) => (b.gainLoss ?? 0) - (a.gainLoss ?? 0));
    let accumGain = 0;
    const topContributors: typeof gainers = [];
    for (const g of gainers) {
      accumGain += g.gainLoss ?? 0;
      topContributors.push(g);
      if (totalGains > 0 && accumGain / totalGains >= 0.8) break;
    }
    const topContribPercent = totalGains > 0 ? (accumGain / totalGains) * 100 : 0;

    const losers = [...lossMakers].sort((a, b) => (a.gainLoss ?? 0) - (b.gainLoss ?? 0));
    let accumLoss = 0;
    const topLosers: typeof losers = [];
    for (const l of losers) {
      accumLoss += l.gainLoss ?? 0;
      topLosers.push(l);
      if (totalLosses !== 0 && Math.abs(accumLoss / totalLosses) >= 0.7) break;
    }
    const topLossPercent = totalLosses !== 0 ? Math.abs(accumLoss / totalLosses) * 100 : 0;

    return {
      gainLoss,
      gainLossPercent,
      gainColor,
      ArrowIcon,
      profitable,
      lossMakers,
      totalGains,
      totalLosses,
      gainPercent,
      lossPercent,
      topContributors,
      topContribPercent,
      topLosers,
      topLossPercent,
    };
  }, [totalInvestment, totalPresentValue, holdings]);

  return (
    <div className="space-y-3 w-full h-[16rem] overflow-y-auto pr-1">
      {/* Summary Cards Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Absolute Return */}
        <div className="flex-1 p-3 bg-white shadow-md rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Absolute Return</p>
            <h2 className={`text-xl font-bold ${gainColor}`}>₹{gainLoss.toFixed(2)}</h2>
            <p className={`text-xs ${gainColor}`}>{gainLossPercent.toFixed(2)}%</p>
          </div>
          <ArrowIcon className={`w-5 h-5 ${gainColor}`} />
        </div>

        {/* Present vs Invested */}
        <div className="flex-1 p-3 bg-white shadow-md rounded-xl border flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Present Value / Invested</p>
            <h2 className="text-lg font-bold text-gray-800">
              ₹{totalPresentValue.toFixed(2)}{" "}
              <span className="text-sm text-gray-400 font-medium">
                / ₹{totalInvestment.toFixed(2)}
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Insight: Profit vs Loss Distribution */}
      {holdings.length > 0 && (
        <div className="p-3 bg-white shadow-md rounded-xl border text-sm text-gray-600">
          <span className="font-bold text-green-600">{profitable.length}</span> of{" "}
          <span className="text-gray-800">{holdings.length}</span> stocks in profit,
          contributing <span className="font-semibold text-green-600">₹{totalGains.toFixed(0)} ({gainPercent.toFixed(1)}%)</span>.{" "}
          <span className="font-bold text-red-600">{lossMakers.length}</span> are in loss dragging with{" "}
          <span className="font-semibold text-red-600">₹{Math.abs(totalLosses).toFixed(0)} ({lossPercent.toFixed(1)}%)</span>.
        </div>
      )}

      {/* Gain/Loss Contributor Insights */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <div className="flex-1 p-3 bg-white shadow-md rounded-xl border text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <p>
                💹 Top <span className="font-bold text-green-600">{topContributors.length}</span> stocks contribute{" "}
                <span className="font-semibold text-green-600">{topContribPercent.toFixed(1)}%</span> of your profit.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {topContributors.map((g) => (
                      <div key={g.particulars}>
                        {g.particulars}: ₹{g.gainLoss?.toFixed(2)}
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}

        {/* Top Losers */}
        {topLosers.length > 0 && (
          <div className="flex-1 p-3 bg-white shadow-md rounded-xl border text-sm text-red-600">
            <div className="flex justify-between items-center">
              <p>
                📉 Bottom <span className="font-bold">{topLosers.length}</span> stocks cause{" "}
                <span className="font-semibold">{topLossPercent.toFixed(1)}%</span> of your loss.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {topLosers.map((l) => (
                      <div key={l.particulars}>
                        {l.particulars}: ₹{l.gainLoss?.toFixed(2)}
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
