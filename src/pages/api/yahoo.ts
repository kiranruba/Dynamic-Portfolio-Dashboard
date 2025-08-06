import type { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs';
import path from 'path';

const assetsPath = path.join(process.cwd(), 'src/data/assets.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));

    for (const asset of assets) {
      if (!asset.ticker) {
        console.warn(`⚠️ No ticker for ${asset.holdingId}, skipping`);
        continue;
      }

      try {
        const quote = await yahooFinance.quote(asset.ticker);
        const quoteData = Array.isArray(quote) ? quote[0] : quote;

        if (!quoteData || typeof quoteData.regularMarketPrice !== 'number') {
          console.warn(`⚠️ No market price for ${asset.ticker}`, quoteData);
          continue;
        }

        asset.marketData.cmp = quoteData.regularMarketPrice;
        
      } catch (err) {
        console.error(`Error fetching data for ${asset.ticker}`, err);
      }
    }

    fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));

    res.status(200).json({ success: true, assets });
  } catch (error) {
    console.error('Yahoo API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Yahoo Finance data' });
  }
}