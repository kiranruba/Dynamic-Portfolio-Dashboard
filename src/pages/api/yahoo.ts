import type { NextApiRequest, NextApiResponse } from 'next';
import yahooFinance from 'yahoo-finance2';

type Asset = {
    holdingId: string;
    ticker: string;
    marketData: {
        cmp: number | null;
    };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // ✅ Import static assets from JSON (works in both dev and Netlify)
        const { default: staticAssets } = await import('@/data/assets.json');

        // ✅ Clone to avoid mutating the imported module
        const assets: Asset[] = JSON.parse(JSON.stringify(staticAssets));

        // ✅ Fetch all prices in parallel for better performance
        const fetchPromises = assets.map(async (asset) => {
            if (!asset.ticker) {
                console.warn(`⚠️ No ticker for ${asset.holdingId}, skipping`);
                return;
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
        });

        // ✅ Wait for all fetches to complete
        await Promise.all(fetchPromises);

        // ✅ Return fresh data (no file writing needed!)
        res.status(200).json({ success: true, assets });
    } catch (error) {
        console.error('❌ Yahoo API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Yahoo Finance data',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}