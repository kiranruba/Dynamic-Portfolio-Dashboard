import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// Path to the local assets.json file (for dev)
const assetsPath = path.join(process.cwd(), "src/data/assets.json");

// Public Google Sheets CSV URL (make sure it's published)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1weeH4enKertGhPXlLRaivJYz1M0P-YZ0cc6Q-hla-qo/export?format=csv&gid=0";

// In-memory cache for production
let cachedAssets: Asset[] | null = null;
let lastFetchedAt: number | null = null;
const CACHE_TTL = 15 * 1000; // 15 seconds
const DISABLE_CACHE = true; // toggle for debugging

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
    const now = Date.now();
    const isProd = process.env.NODE_ENV === "production";

    // Return from cache in production (if valid)
    if (
      isProd &&
      !DISABLE_CACHE &&
      cachedAssets &&
      lastFetchedAt &&
      now - lastFetchedAt < CACHE_TTL
    ) {
      return res.status(200).json({ success: true, assets: cachedAssets });
    }

    // Fetch latest Google Sheet CSV
    const response = await fetch(`${SHEET_URL}&cacheBust=${Date.now()}`);
    const csv = await response.text();

    const rows = csv.trim().split("\n").slice(1); // skip header
    const peData: PeData = {};

    for (const row of rows) {
      const [holdingId, ticker, pe, eps] = row.split(",").map((s) => s.trim());
      if (holdingId && ticker) {
        peData[holdingId] = {
          pe: parseFloat(pe) || 0,
          eps: parseFloat(eps) || 0,
        };
      }
    }

    let assets: Asset[];

    if (!isProd) {
      assets = JSON.parse(fs.readFileSync(assetsPath, "utf-8"));
    } else {
      const { default: staticAssets } = await import("@/data/assets.json");
      assets = staticAssets;
    }

    // Update assets with latest PE/EPS data
    assets.forEach((asset) => {
      const match = peData[asset.holdingId];
      if (match) {
        asset.marketData.pe = match.pe;
        asset.marketData.latestEarnings = match.eps;
      }
    });

    // DEV: persist updated data to file
    if (!isProd) {
      fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
    } else {
      // PROD: use in-memory cache
      cachedAssets = assets;
      lastFetchedAt = now;
    }

    res.status(200).json({ success: true, assets });
  } catch (err) {
    console.error("❌ Google API error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch Google Finance data" });
  }
}
