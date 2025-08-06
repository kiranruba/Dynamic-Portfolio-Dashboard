# Portfolio Dashboard: Technical Document

## 1. Project Overview
The Portfolio Dashboard is a full-stack web application designed to visualize and track personal stock holdings, providing real-time market data, performance metrics, and portfolio allocation insights. Built using Next.js and React, the application is modular, scalable, and responsive, fulfilling all key requirements of the assignment. The design emphasizes a clear separation of concerns, usability, and a clean aesthetic.

### Technology Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Libraries**:
  - `yahoo-finance2`: Real-time market data fetching
  - `@tanstack/react-table`: Dynamic, sortable, and searchable table rendering
  - `recharts`, `@nivo/sunburst`: Interactive bar and sunburst charts
  - `axios`: Promise-based API calls

## 2. Architectural Design
The application leverages a Next.js full-stack architecture, integrating frontend rendering and backend data processing with a focus on efficiency and scalability.

### Data Flow
The data flow is dynamic, resilient, and optimized for real-time updates:
1. The `Dashboard` component initializes by fetching an enriched portfolio from the server.
2. A client-side `setInterval` loop triggers data refreshes every 15 seconds.
3. Two API routes (`/api/yahoo` and `/api/google`) are called in parallel using `Promise.all` to fetch real-time market data (CMP, P/E, EPS).
4. Market data is cached in local JSON files (`assets.json`, `portfolios.json`), simulating a database.
5. The `getEnrichedPortfolioData` utility runs server-side, combining static portfolio data with live market data to calculate derived metrics (Investment, P&L, etc.).
6. The `Dashboard` component updates its state, triggering a UI re-render with fresh data.

### Data Modeling
- **JSON Structure**:
  - `portfolios.json`: Stores user-specific data (`holdingId`, `type`, `particulars`, `purchasePrice`, `purchaseQty`, `purchaseDate`).
  - `assets.json`: Master reference for market data (`cmp`, `pe`, `latestEarnings`, `marketCap`, `sector`).
  - Rationale: Separates static user data from dynamic market data, preventing duplication and enabling independent updates.
- **Asset Generalization**: Uses a generic `particulars` field and `type` field (`stock`, `bond`, etc.) to support diverse asset classes.
- **Derived vs. Stored Values**: Metrics like `investment`, `presentValue`, `gainLoss`, and `portfolioPercent` are calculated dynamically during enrichment to ensure accuracy and avoid redundancy.
- **Proposed SQL Schema**:
  - `Users`: `user_id` (PK), `user_name`, `email`
  - `Portfolios`: `portfolio_id` (PK), `user_id` (FK), `portfolio_name`, `portfolio_type`, `created_at`
  - `Assets`: `asset_id` (PK), `type`, `particulars`, `ticker`, `sector`, `maturity_date`, `interest_rate`
  - `Holdings`: `holding_id` (PK), `portfolio_id` (FK), `asset_id` (FK), `purchase_price`, `purchase_qty`, `purchase_date`, `sale_price`, `flag`
  - `Live_Data`: `asset_id` (FK), `cmp`, `pe`, `market_cap`, `latest_earnings`, `last_updated`
  - Rationale: Normalized schema ensures scalability, relational integrity, and efficient querying for production environments.

## 3. Key Technical Challenges and Solutions
### Challenge 1: Unofficial APIs and Data Sourcing
- **Problem**: Official Yahoo and Google Finance APIs are unavailable or have strict rate limits.
- **Solution**:
  - **Yahoo Finance (CMP)**: Utilized `yahoo-finance2`, a robust open-source Node.js library, to fetch real-time CMP and market data without web scraping. It supports batch queries, reducing API calls.
  - **Google Finance (P/E, EPS)**: Implemented a Google Sheet with `GOOGLEFINANCE()` formulas, published as a CSV, and parsed via the `/api/google` route. This free, stable solution avoids rate limits and complex API key management.

### Challenge 2: Real-Time Data Updates
- **Problem**: The dashboard requires automatic updates every 15 seconds for CMP, Present Value, and P&L.
- **Solution**: A `setInterval` loop in `Dashboard.tsx` triggers parallel API calls (`/api/yahoo`, `/api/google`) using `Promise.all`, ensuring efficient data fetching and a single UI update per cycle.

### Challenge 3: Data Transformation and UI Rendering
- **Problem**: Raw portfolio data needed enrichment with market data for metrics and visualizations.
- **Solution**: The `getEnrichedPortfolioData` utility handles server-side data transformation, joining user holdings with live market data, calculating derived metrics, and aggregating by sector for frontend rendering.

## 4. UI Design and Implementation
### Portfolio Table
- Built with `@tanstack/react-table` for dynamic rendering.
- **Features**:
  - **Sector Grouping**: Collapsible rows group holdings by sector for readability.
  - **Dynamic Columns**: Supports future column additions/removals.
  - **Sorting & Searching**: Sortable columns and a search bar for filtering by name.
  - **Visuals**: Color-coded Gain/Loss (green for positive, red for negative), `CircularProgress` for portfolio allocation with external percentage display.

### Visualizations
- **Portfolio Summary**: Displays KPIs (total return, present vs. invested value).
- **Highest & Lowest ROI Bar Chart**: Highlights top 5 gainers/losers using `recharts`.
- **Portfolio Sunburst Chart**: Visualizes allocation by sector and stock using `@nivo/sunburst`.

## 5. API Integration Strategy
### Yahoo Finance (CMP)
- **Library**: `yahoo-finance2`
- **Implementation**: The `/api/yahoo` route reads `assets.json`, calls `yahooFinance.quote(ticker)` for each asset, updates `cmp`, and persists changes to `assets.json`.
- **Rationale**: Free, stable, supports batch queries, avoids rate limits, and meets the 15-second refresh requirement.
- **Challenges**:
  - Ticker mapping differences (e.g., `.NS`, `.BO`).
  - Handling undefined `regularMarketPrice`.
  - Mitigated by batching logic and error handling.

### Google Finance (P/E, EPS)
- **Method**: Google Sheet with `GOOGLEFINANCE("TICKER", "pe")` and `eps`, published as a public CSV.
- **Implementation**: The `/api/google` route fetches and parses the CSV, updating `pe` and `latestEarnings` in `assets.json`.
- **Rationale**: Free, avoids rate limits, simple for demo purposes, and safe (no sensitive data exposed).
- **Challenges**:
  - Mapping Sheet `holdingId` to local assets.
  - Handling `#N/A` values gracefully.
  - Chosen over Google Sheets API to avoid service account complexity.

### Dashboard Integration
- **Parallel Calls**: `await Promise.all([fetch("/api/yahoo"), fetch("/api/google")])`
- **Auto-Refresh**: `setInterval` triggers updates every 15 seconds.
- **Caching**: Persists market data in `assets.json` for reliability.
- **State Management**: `Dashboard.tsx` updates state to sync UI with fresh data.

## 6. Performance & Testing
### Optimizations
- Applied `useMemo` in key components to minimize redundant calculations and re-renders.
- Server-side `loadData.ts` handles data enrichment for efficiency.
- Batch API queries reduce server load.

### Testing
- **Functional**: Validated calculations against provided Excel sheet.
- **Dynamic Updates**: Confirmed 15-second CMP refresh cycle.
- **Responsiveness**: Tested on desktop, tablet, and mobile devices.
- **Edge Cases**: Handled null/missing data gracefully without crashes.

## 7. Future Improvements
- Centralize data enrichment in a single server-side endpoint.
- Replace JSON files with a relational database (e.g., PostgreSQL, MySQL).
- Implement WebSockets for event-driven, real-time updates to reduce server load.
- Add user authentication for secure multi-user portfolio management.
- Explore paid APIs (e.g., Alpha Vantage, IEX Cloud) for production-grade data.

## 8. Design Rationale
- **Data Model**: Flat holdings structure simplifies rendering; separate `portfolios.json` and `assets.json` prevent duplication and enable asynchronous updates.
- **TypeScript**: Interfaces (`Holding`, `Portfolio`, `EnrichedPortfolio`) enforce type safety, mirroring JSON structure and preventing runtime errors.
- **SQL Proposal**: Normalized schema supports scalability, relational integrity, and efficient numeric calculations.
- **API Choices**: `yahoo-finance2` and Google Sheets CSV balance simplicity, cost, and reliability for the assignment.
- **Performance**: Memoization and server-side enrichment optimize rendering and calculations.
- **UI Design**: Clean layout with collapsible tables, color-coded metrics, and intuitive visualizations enhances usability.

This comprehensive solution demonstrates a robust, scalable, and user-focused approach, meeting all technical and functional requirements with a strategic design.