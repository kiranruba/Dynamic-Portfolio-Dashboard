// pages/api/yahoo.ts
import type { NextApiRequest, NextApiResponse } from 'next'; 
import yahooFinance from 'yahoo-finance2';
import fs from 'fs';
import path from 'path';

const assetsPath = path.join(process.cwd(), 'src/data/assets.json');
const isProd = process.env.NODE_ENV === 'production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let assets: any[];

    if (!isProd) {
      // ✅ Local DEV: read from file
      assets = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'));
    } else {
      // ✅ PROD (Vercel-safe): import JSON directly
      const { default: staticAssets } = await import('@/data/assets.json');
      assets = staticAssets;
    }

    for (const asset of assets) {
      if (!asset.ticker) {
        console.warn(`⚠️ No ticker for ${asset.holdingId}, skipping`);
        continue;
      }

      try {
        const quote = await yahooFinance.quote(asset.ticker);
        const quoteData = Array.isArray(quote) ? quote[0] : quote;

        asset.marketData.cmp =
          quoteData && typeof quoteData.regularMarketPrice === 'number'
            ? quoteData.regularMarketPrice
            : null;
      } catch (err) {
        console.error(`❌ Error fetching data for ${asset.ticker}`, err);
        asset.marketData.cmp = null;
      }
    }

    if (!isProd) {
      // ✅ DEV: write back updated assets
      fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
    } else {
      // ✅ PROD: skip writing, can optionally cache
    }

    res.status(200).json({ success: true, assets });
  } catch (error) {
    console.error('❌ Yahoo API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Yahoo Finance data' });
  }
}
