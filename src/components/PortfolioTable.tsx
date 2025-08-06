"use client";

import React, { useState, useMemo } from "react";
import { Holding, Portfolio } from "@/types/portfolio";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { CircularProgress } from "@/components/CircularProgress";

interface ColumnConfig {
  key: keyof Holding;
  label: string;
  type: "text" | "number" | "gainloss" | "progress" | "code";
  sortable?: boolean;
}

interface PortfolioTableProps {
  portfolio: Portfolio;
  expandedSectors: Record<string, boolean>;
  setExpandedSectors: Dispatch<SetStateAction<Record<string, boolean>>>;
}

const columns: ColumnConfig[] = [
  { key: "particulars", label: "Particulars", type: "text", sortable: true },
  { key: "purchasePrice", label: "Purchase Price", type: "number", sortable: true },
  { key: "purchaseQty", label: "Quantity", type: "number", sortable: true },
  { key: "investment", label: "Investment", type: "number", sortable: true },
  { key: "portfolioPercent", label: "Portfolio %", type: "progress", sortable: true },
  { key: "holdingId", label: "NSE/BSE", type: "code", sortable: true },
  { key: "cmp", label: "CMP", type: "number", sortable: true },
  { key: "presentValue", label: "Present Value", type: "number", sortable: true },
  { key: "gainLoss", label: "Gain/Loss", type: "gainloss", sortable: true },
  { key: "pe", label: "P/E", type: "number", sortable: true },
  { key: "latestEarnings", label: "Latest Earnings", type: "number", sortable: true },
];

export default function PortfolioTable({
  portfolio,
  expandedSectors,
  setExpandedSectors,
}: PortfolioTableProps) {
  const [sortBy, setSortBy] = useState<keyof Holding | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = useMemo(() => {
  return portfolio.holdings.filter((h) =>
    h.particulars?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [portfolio.holdings, searchQuery]);


  const grouped = useMemo(() => {
  const g: Record<string, Holding[]> = {};
  filtered.forEach((h) => {
    const sector = h.sector || "Others";
    g[sector] = g[sector] || [];
    g[sector].push(h);
  });

  if (sortBy) {
    Object.keys(g).forEach((sector) => {
      g[sector].sort((a, b) => {
        const aVal = a[sortBy] as number;
        const bVal = b[sortBy] as number;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    });
  }

  return g;
}, [filtered, sortBy, sortOrder]);


  
  const toggleSector = (sector: string) => {
    setExpandedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }));
  };

  const handleSort = (key: keyof Holding) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  if (sortBy) {
    Object.keys(grouped).forEach((sector) => {
      grouped[sector].sort((a, b) => {
        const aVal = a[sortBy] as number;
        const bVal = b[sortBy] as number;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    });
  }

  const getSectorSummary = (rows: Holding[]) => {
    const investment = rows.reduce((sum, h) => sum + (h.investment || 0), 0);
    const percent = rows.reduce((sum, h) => sum + (h.portfolioPercent || 0), 0);
    const presentValue = rows.reduce((sum, h) => sum + (h.presentValue || 0), 0);
    const gainLoss = rows.reduce((sum, h) => sum + (h.gainLoss || 0), 0);
    const gainLossPercent = rows.reduce((sum, h) => sum + (h.gainLossPercent || 0), 0);
    return { investment, percent, presentValue, gainLoss, gainLossPercent };
  };
const isAllExpanded = useMemo(() => {
  return Object.values(expandedSectors).every((v) => v);
}, [expandedSectors]);



  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
       <input
          className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 p-1 rounded w-full max-w-sm transition-colors"
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      

<button
className="ml-4 text-blue-600 dark:text-blue-400 hover:underline"
  onClick={() => {
    const newState: Record<string, boolean> = {};
    Object.keys(grouped).forEach((sector) => {
      newState[sector] = !isAllExpanded;
    });
    setExpandedSectors(newState);
  }}
>
  {isAllExpanded ? "Collapse All" : "Expand All"}
</button>


      </div>

<table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden transition-colors">
<thead className="bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-gray-300 transition-colors">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className="p-2 border cursor-pointer text-left"
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable &&
                    (sortBy !== col.key ? (
                      <ArrowUpDown size={10} className="text-gray-400" />
                    ) : sortOrder === "asc" ? (
                      <ArrowUp size={10} />
                    ) : (
                      <ArrowDown size={10} />
                    ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Object.entries(grouped).map(([sector, rows]) => {
            const summary = getSectorSummary(rows);
            return (
              <React.Fragment key={sector}>
            <tr className="bg-gray-100 dark:bg-gray-800 font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleSector(sector)}
                >
                  {columns.map((col, idx) => {
                    let content: React.ReactNode = "";
                    if (col.key === "particulars") {
                      content = <span >{sector}</span>;
                    } else if (col.key === "investment") {
                      content = `₹${summary.investment.toFixed(2)}`;
                    } else if (col.key === "portfolioPercent") {
                      content = (
                        <div className="flex items-center gap-1 justify-start">
                          <CircularProgress percent={summary.percent} />
                          <span>{summary.percent.toFixed(2)}%</span>
                        </div>
                      );
                    } else if (col.key === "presentValue") {
                      content = `₹${summary.presentValue.toFixed(2)}`;
                    } else if (col.key === "gainLoss") {
                      const isGain = summary.gainLoss >= 0;
                      content = (
                        <div
                          className={`flex items-center text-sm font-semibold rounded px-2 py-1 ${isGain 
                                      ? "bg-green-100 dark:bg-green-900 text-green-600  dark:text-green-100" 
                                      : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100"
                                    }
                                    `}
                        >
                          <span className="mr-1">{isGain ? "▲" : "▼"}</span>
                          <span>{summary.gainLoss.toFixed(2)}</span>
                          <span className="ml-1">({summary.gainLossPercent.toFixed(2)}%)</span>
                        </div>
                      );
                    }

                    const isLastColumn = idx === columns.length - 1;
                    return (
                      <td
                        key={col.key as string}
                        className="p-2 border-transparent text-sm"
                      >
                        <div className="flex items-center justify-between w-full">
                          {content}
                          {isLastColumn && (
                            <span className="ml-auto">
                              {expandedSectors[sector] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                  {expandedSectors[sector] &&
                    rows.map((h, rowIndex) => (
                  <tr key={`${sector}-${h.holdingId ?? rowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {columns.map((col) => {
                        const val = h[col.key];
                        let content: React.ReactNode = "";
                        if (col.type === "number") {
                          content = typeof val === "number" ? val.toFixed(2) : "";
                        } else if (col.type === "gainloss") {
                          const num = h.gainLoss || 0;
                          const percent = h.gainLossPercent || 0;
                          const isGain = num >= 0;
                          content = (
                            <div
                              className={`flex items-center text-sm font-semibold rounded px-2 py-1 ${isGain 
                                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-100" 
                                      : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100"
                                    }
                                    `}
                            >
                              <span className="mr-1">{isGain ? "▲" : "▼"}</span>
                              <span>{num.toFixed(2)}</span>
                              <span className="ml-1">({percent.toFixed(2)}%)</span>
                            </div>
                          );
                        } else if (col.type === "progress") {
                          const percent = h.portfolioPercent || 0;
                          content = (
                            <div className="flex items-center gap-1 justify-start">
                              <CircularProgress percent={percent} />
                              <span>{percent.toFixed(2)}%</span>
                            </div>
                          );
                        } else if (col.type === "code") {
                          content = val ? <code className="text-sm text-gray-500 dark:text-gray-400">{val}</code> : "";
                        } else {
                          content = val || "";
                        }

                        return (
                          <td key={col.key} className="p-2 border border-gray-300 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-300 transition-colors">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
