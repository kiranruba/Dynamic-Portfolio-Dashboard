"use client";

import { ResponsiveBar } from "@nivo/bar";
import { Holding } from "@/types/portfolio";
import { useMemo } from "react";

interface PortfolioGainLossBarProps {
  holdings: Holding[];
  title: string;
}

export default function PortfolioGainLossBar({
  holdings,
  title,
}: PortfolioGainLossBarProps) {
  const { chartData, axisMin, axisMax } = useMemo(() => {
    const gainers = holdings
      .filter((h) => (h.gainLossPercent ?? 0) > 0)
      .sort((a, b) => (b.gainLossPercent ?? 0) - (a.gainLossPercent ?? 0))
      .slice(0, 5);

    const losers = holdings
      .filter((h) => (h.gainLossPercent ?? 0) < 0)
      .sort((a, b) => (a.gainLossPercent ?? 0) - (b.gainLossPercent ?? 0))
      .slice(0, 5);

    const chartData = [
      ...gainers.map((h) => ({
        stock: h.particulars,
        percent: Number(h.gainLossPercent?.toFixed(2)),
      })),
      ...losers.map((h) => ({
        stock: h.particulars,
        percent: Number(h.gainLossPercent?.toFixed(2)),
      })),
    ].reverse();

    const allPercents = chartData.map((d) => d.percent);
    const axisMin = Math.min(...allPercents, 0) - 2;
    const axisMax = Math.max(...allPercents, 0) + 2;

    return { chartData, axisMin, axisMax };
  }, [holdings]);

  return (
    <div className="bg-white p-2 shadow-md border rounded-xl h-[15.5rem] mb-6">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <ResponsiveBar
        data={chartData}
        keys={["percent"]}
        indexBy="stock"
        layout="horizontal"
        margin={{ top: 5, right: 10, bottom: 35, left: 80 }}
        padding={0.3}
        valueScale={{ type: "linear", min: axisMin, max: axisMax }}
        colors={({ data }) => (data.percent >= 0 ? "#16a34a" : "#dc2626")}
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
        }}
        label={({ data }) => `${data.percent}%`}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff"
        animate
        motionConfig="gentle"
        tooltip={({ data }) => (
          <div className="px-2 py-1 rounded bg-gray-900 text-white text-sm">
            {data.stock}: {data.percent}%
          </div>
        )}
      />
    </div>
  );
}
