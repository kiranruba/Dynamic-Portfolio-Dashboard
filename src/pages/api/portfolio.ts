import type { NextApiRequest, NextApiResponse } from 'next';

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

type Holding = {
    holdingId: string;
    type: string;
    particulars: string;
    purchasePrice: number;
    purchaseQty: number;
    purchaseDate: string | null;
    nseBseCode?: string;
    sector?: string;
    cmp?: number;
    marketCap?: number|null;
    pe?: number|null;
    latestEarnings?: number|null;
    investment?: number;
    presentValue?: number;
    gainLoss?: number;
    gainLossPercent?: number;
    portfolioPercent?: number;
};

type Portfolio = {
    portfolioId: number;
    userId: string;
    portfolioName: string;
    portfolioType: string;
    holdings: Holding[];
    totalInvestment?: number;
    totalPresentValue?: number;
    totalGainLoss?: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Fetch live data from both APIs in parallel
        const [yahooRes, googleRes] = await Promise.all([
            fetch(`${req.headers.origin || 'http://localhost:3000'}/api/yahoo`),
            fetch(`${req.headers.origin || 'http://localhost:3000'}/api/google`)
        ]);

        if (!yahooRes.ok || !googleRes.ok) {
            throw new Error('Failed to fetch market data');
        }

        const [yahooData, googleData] = await Promise.all([
            yahooRes.json(),
            googleRes.json()
        ]);

        // Merge the data
        const assetsMap = new Map<string, Asset>();

        // First add Google data (PE, EPS)
        if (googleData.success && googleData.assets) {
            googleData.assets.forEach((asset: Asset) => {
                assetsMap.set(asset.holdingId, asset);
            });
        }

        // Then update with Yahoo data (CMP)
        if (yahooData.success && yahooData.assets) {
            yahooData.assets.forEach((asset: Asset) => {
                const existing = assetsMap.get(asset.holdingId);
                if (existing) {
                    existing.marketData.cmp = asset.marketData.cmp;
                } else {
                    assetsMap.set(asset.holdingId, asset);
                }
            });
        }

        // Load portfolio structure
        const portfolioData = await import('@/data/portfolios.json');
        const portfolios: Portfolio[] = JSON.parse(JSON.stringify(portfolioData.default));

        // Enrich portfolios with market data
        portfolios.forEach((portfolio) => {
            let totalInvestment = 0;
            let totalPresentValue = 0;

            portfolio.holdings.forEach((holding) => {
                const asset = assetsMap.get(holding.holdingId);

                if (asset) {
                    // Update holding with market data
                    holding.sector = asset.sector;
                    holding.cmp = asset.marketData.cmp;
                    holding.pe = asset.marketData.pe;
                    holding.marketCap = asset.marketData.marketCap;
                    holding.latestEarnings = asset.marketData.latestEarnings;
                }

                // Calculate derived values
                holding.investment = holding.purchasePrice * holding.purchaseQty;
                holding.presentValue = (holding.cmp || holding.purchasePrice) * holding.purchaseQty;
                holding.gainLoss = holding.presentValue - holding.investment;
                holding.gainLossPercent = holding.investment
                    ? (holding.gainLoss / holding.investment) * 100
                    : 0;

                totalInvestment += holding.investment;
                totalPresentValue += holding.presentValue;
            });

            // Calculate portfolio percentages
            portfolio.holdings.forEach((holding) => {
                holding.portfolioPercent = totalInvestment
                    ? ((holding.investment || 0) / totalInvestment) * 100
                    : 0;
            });

            portfolio.totalInvestment = totalInvestment;
            portfolio.totalPresentValue = totalPresentValue;
            portfolio.totalGainLoss = totalPresentValue - totalInvestment;
        });

        res.status(200).json(portfolios);
    } catch (error) {
        console.error('❌ Portfolio API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to build portfolio',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}