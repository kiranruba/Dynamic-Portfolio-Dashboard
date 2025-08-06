import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const assetsPath = path.join(process.cwd(), "src/data/assets.json");
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSUo8CJaexTF4jGZoyt8ttmARGppkGwNW0IDbfz6dLTdttI7zECNJuZhhkxuVCdbGn_wxopktSOTVf/pub?gid=0&single=true&output=csv";

// ✅ In-memory cache for production
let cachedAssets: Asset[] | null = null;
let lastFetchedAt: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Define types
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

    // ✅ Reuse cached data in production if still valid
    if (isProd && cachedAssets && lastFetchedAt && now - lastFetchedAt < CACHE_TTL) {
      return res.status(200).json({ success: true, assets: cachedAssets });
    }

    // ✅ Fetch Google Sheet CSV
    const response = await fetch(SHEET_URL);
    const csv = await response.text();

    const rows = csv.split("\n").slice(1); // Skip headers
    const peData: PeData = {};

    rows.forEach(row => {
      const [holdingId, ticker, pe, eps] = row.split(",");
      if (holdingId && ticker) {
        peData[holdingId.trim()] = {
          pe: parseFloat(pe) || 0,
          eps: parseFloat(eps) || 0,
        };
      }
    });

    let assets: Asset[] = [];

    if (!isProd) {
      // ✅ DEV: Read from file
      assets = JSON.parse(fs.readFileSync(assetsPath, "utf-8"));
    } else {
      // ✅ PROD: Load static file via import (Vercel safe)
      const { default: staticAssets } = await import("@/data/assets.json");
      assets = staticAssets;
    }

    // ✅ Update with live PE/EPS data
    assets.forEach(asset => {
      const match = peData[asset.holdingId];
      if (match) {
        asset.marketData.pe = match.pe;
        asset.marketData.latestEarnings = match.eps;
      }
    });

    if (!isProd) {
      // ✅ DEV: Write back to file
      fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
    } else {
      // ✅ PROD: Cache in-memory
      cachedAssets = assets;
      lastFetchedAt = now;
    }

    res.status(200).json({ success: true, assets });
  } catch (err) {
    console.error("Google API error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch Google Finance data" });
  }
}
