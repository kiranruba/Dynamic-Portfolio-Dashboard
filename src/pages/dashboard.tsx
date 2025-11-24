"use client";

import { useEffect, useState, useMemo } from "react";
import { Portfolio } from "@/types/portfolio";
import PortfolioCard from "@/components/PortfolioCard";

export default function Dashboard() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshData = async () => {
        try {
            setError(null);

            // Fetch enriched portfolio (which internally calls yahoo and google APIs)
            const res = await fetch("/api/portfolio");

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success === false) {
                throw new Error(data.error || 'Failed to fetch portfolio');
            }

            setPortfolios(data);
        } catch (err) {
            console.error("Error fetching portfolio:", err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();

        // Refresh every 30 seconds (adjust as needed)
        const interval = setInterval(refreshData, 15000);

        return () => clearInterval(interval);
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

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
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
                <span className="ml-3 text-gray-700 dark:text-gray-300 text-lg">
                    Loading portfolio data...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-800 dark:text-red-200 text-lg font-semibold mb-2">
                        Error Loading Portfolio
                    </h2>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={refreshData}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!portfolio) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-600 dark:text-gray-400">No portfolio data available</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div style={{ float: 'right', margin: '1rem' }}>
                <button
                    onClick={refreshData}
                    disabled={loading}
                    className="disabled:bg-gray-400 text-black dark:text-white  px-4 py-2 rounded-lg  flex items-center gap-2"
                >
                    <svg
                        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
            <PortfolioCard portfolio={{ ...portfolio, sectors }} />
        </div>
    );
}