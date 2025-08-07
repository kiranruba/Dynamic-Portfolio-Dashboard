// src/pages/api/portfolio.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getEnrichedPortfolioData } from "@/utils/loadData"; // uses fs

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = getEnrichedPortfolioData(); // server-side fs usage
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load portfolio data" });
    console.error('❌ API error:', err);
  }
}
