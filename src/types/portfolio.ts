// 🔹 Base Holding Interface (generalized for any asset type)
export interface Holding {
  holdingId: string;                         // Unique ID for the holding
  type: "stock" | "bond" | "mutualFund" | "fixedDeposit";  // Asset type
  particulars: string;                       // Display name (e.g., Stock Name, Bond Name)
  purchasePrice: number;
  purchaseQty: number;
  purchaseDate: string | null;

  // 🔄 Derived fields (calculated in frontend)
  investment?: number;                       // purchasePrice * purchaseQty
  portfolioPercent?: number;                 // (investment / totalPortfolioInvestment) * 100
  presentValue?: number;                     // cmp * purchaseQty (for stocks)
  gainLoss?: number;                         // presentValue - investment
  gainLossPercent?: number;                  // (gainLoss / investment) * 100

  // 🌐 Market data (mainly for stocks)
  nseBseCode?: string;                       // For stocks
  cmp?: number;                              // Current Market Price
  marketCap?: number;
  pe?: number;
  latestEarnings?: number;

  // ✅ sector
  sector?: string;

  // 🔧 Additional metadata (for bonds/FDs/MFs)
  maturityDate?: string | null;              // For FDs/Bonds
  interestRate?: number;                     // For FDs/Bonds
}

// 🔹 Portfolio-level details
export interface Portfolio {
  portfolioId: number;
  userId: string;
  portfolioName: string;
  portfolioType: string;                     // e.g., "Equity", "Debt", "Mixed"
  holdings: Holding[];
  
  // 🔄 Optional derived totals (calculated in frontend)
  totalInvestment?: number;
  totalPresentValue?: number;
  totalGainLoss?: number;
}

// 🔹 User-level root data
export interface UserData {
  userId: string;                            // UUID
  userName: string;
  portfolios: Portfolio[];
}

export interface EnrichedHolding extends Holding {
  sector: string;
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioPercent: number;
}
//for  sectors in getEnrichedPortfolioData
export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  sectorPercent: number;
}

// for enriched portfolio with sectors array
export interface EnrichedPortfolio extends Portfolio {
  sectors: SectorSummary[];
}
export interface Asset {
  holdingId: string;
  particulars: string;
  sector: string;
  marketData: {
    cmp: number;
    pe: number | null;
    marketCap: number | null;
    latestEarnings: number | null;
  };
}