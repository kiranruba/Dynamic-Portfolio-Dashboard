import type { NextApiRequest, NextApiResponse } from "next";

// Public Google Sheets CSV URL
const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1weeH4enKertGhPXlLRaivJYz1M0P-YZ0cc6Q-hla-qo/export?format=csv&gid=0";

// ---- Types ----
type MarketData = {
    cmp: number;
    pe: number | null;
    marketCap: number | null;
    latestEarnings: number | null;
};

type Asset = {
    holdingId: string;
    ticker: string;
    particulars: string;
    sector: string;
    marketData: MarketData;
};

type PeData = Record<string, { pe: number; eps: number }>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Always fetch fresh data from Google Sheets
        const response = await fetch(`${SHEET_URL}&cacheBust=${Date.now()}`);

        if (!response.ok) {
            throw new Error(`Google Sheets fetch failed: ${response.status}`);
        }

        const csv = await response.text();
        const rows = csv.trim().split("\n").slice(1); // skip header
        const peData: PeData = {};

        // Parse CSV data
        for (const row of rows) {
            const [holdingId, ticker, pe, eps] = row.split(",").map((s) => s.trim());
            if (holdingId && ticker) {
                peData[holdingId] = {
                    pe: parseFloat(pe) || 0,
                    eps: parseFloat(eps) || 0,
                };
            }
        }

        // Import static assets from JSON (read-only, works in Netlify)
        const { default: staticAssets } = await import("@/data/assets.json");

        // Clone the assets to avoid mutation
        const assets: Asset[] = JSON.parse(JSON.stringify(staticAssets));

        // Update assets with latest PE/EPS data from Google Sheets
        assets.forEach((asset) => {
            const match = peData[asset.holdingId];
            if (match) {
                asset.marketData.pe = match.pe;
                asset.marketData.latestEarnings = match.eps;
            }
        });

        // Return the enriched data
        res.status(200).json({ success: true, assets });
    } catch (err) {
        console.error("❌ Google API error:", err);
        res.status(500).json({
            success: false,
            error: "Failed to fetch Google Finance data",
            details: err instanceof Error ? err.message : String(err)
        });
    }
}