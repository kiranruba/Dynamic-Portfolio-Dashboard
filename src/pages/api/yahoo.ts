// pages/api/yahoo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';

const isProd = process.env.NODE_ENV === 'production';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    type Asset = {
  holdingId: string;
  ticker: string;
  marketData: {
    cmp: number | null;
        };
      };

    let assets: Asset[];


    if (!isProd) {
      // ✅ DEV: Load from local file system
      const fs = await import('fs');
      const path = await import('path');
      const assetsPath = path.join(process.cwd(), 'src/data/assets.json');
      const raw = fs.readFileSync(assetsPath, 'utf-8');
      assets = JSON.parse(raw);
    } else {
      // ✅ PROD (Vercel): Load statically bundled file
      const { default: staticAssets } = await import('@/data/assets.json');
      assets = staticAssets;
    }

    // Fetch Yahoo Finance data for each asset
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

    // ✅ Only write back in DEV
    if (!isProd) {
      const fs = await import('fs');
      const path = await import('path');
      const assetsPath = path.join(process.cwd(), 'src/data/assets.json');
      fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
    }

    res.status(200).json({ success: true, assets });
  } catch (error) {
    console.error('❌ Yahoo API error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch Yahoo Finance data' });
  }
}
