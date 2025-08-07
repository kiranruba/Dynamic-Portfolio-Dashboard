import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Portfolio } from "@/types/portfolio";
import { enrichPortfolios } from "@/utils/loadData"; 

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const portfoliosPath = path.join(process.cwd(), "src/data/portfolios.json");
    const assetsPath = path.join(process.cwd(), "src/data/assets.json");

    const portfolios = JSON.parse(fs.readFileSync(portfoliosPath, "utf-8")) as Portfolio[];
    const assets = JSON.parse(fs.readFileSync(assetsPath, "utf-8"));

    const enriched = enrichPortfolios(portfolios, assets); // ✅ now dynamic!

    res.status(200).json(enriched);
  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).json({ message: "Failed to load portfolio data" });
  }
}
