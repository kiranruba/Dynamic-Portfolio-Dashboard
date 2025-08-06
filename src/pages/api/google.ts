import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const assetsPath = path.join(process.cwd(), "src/data/assets.json");
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSUo8CJaexTF4jGZoyt8ttmARGppkGwNW0IDbfz6dLTdttI7zECNJuZhhkxuVCdbGn_wxopktSOTVf/pub?gid=0&single=true&output=csv";

// ✅ Define types
type MarketData = {
  pe: number;
  latestEarnings: number;
};

type Asset = {
  holdingId: string;
  marketData: MarketData;
};

type PeData = Record<string, { pe: number; eps: number }>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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

    const assets: Asset[] = JSON.parse(fs.readFileSync(assetsPath, "utf-8"));

    assets.forEach(asset => {
      const match = peData[asset.holdingId];
      if (match) {
        asset.marketData.pe = match.pe;
        asset.marketData.latestEarnings = match.eps;
      }
    });

    fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));

    res.status(200).json({ success: true, assets });
  } catch (err) {
    console.error("Google API error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch Google Finance data" });
  }
}
