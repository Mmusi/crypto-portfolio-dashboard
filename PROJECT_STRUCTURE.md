# Crypto Portfolio Dashboard - Project Structure

## Overview

A comprehensive React-based cryptocurrency portfolio management dashboard with real-time monitoring, advanced analytics, and intelligent alerting system.

## Project Structure

```
crypto-portfolio-dashboard/
├── public/                          # Static assets
├── src/
│   ├── components/                  # React components
│   │   ├── PortfolioOverview.jsx   # Main portfolio view with allocation & risk
│   │   ├── PerformanceCharts.jsx   # Historical performance visualization
│   │   ├── AlertsPanel.jsx         # Dynamic alert notifications
│   │   ├── CategoryDashboards.jsx  # Asset category breakdowns
│   │   └── PortfolioIndicators.jsx # Sharpe Ratio, Volatility metrics
│   │
│   ├── services/                    # Business logic & API integration
│   │   ├── cryptoApi.js            # CoinGecko API wrapper with caching
│   │   └── alertService.js         # Alert monitoring & generation
│   │
│   ├── utils/                       # Helper functions
│   │   └── portfolioCalculations.js # Financial calculations
│   │
│   ├── types/                       # Type definitions & constants
│   │   └── portfolio.js            # Asset configs, risk tiers, categories
│   │
│   ├── App.jsx                      # Main application component
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles with Tailwind
│
├── index.html                       # HTML template
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── .gitignore                      # Git ignore rules
├── README.md                        # Full documentation
├── QUICKSTART.md                    # Quick start guide
└── PROJECT_STRUCTURE.md            # This file

```

## Core Components

### 1. PortfolioOverview.jsx
**Purpose**: Main dashboard view showing portfolio summary
**Features**:
- Total portfolio value with 24h change
- Asset allocation pie chart
- Risk tier distribution (Safest, Moderate, Risky)
- Visual breakdown by category

**Props**:
- `holdings`: Object with asset symbols and amounts
- `prices`: Current price data from API
- `totalValue`: Calculated total portfolio value

### 2. PerformanceCharts.jsx
**Purpose**: Historical portfolio performance visualization
**Features**:
- Line chart with portfolio value over time
- Timeframe selector (7d, 30d, 90d, 1y)
- Performance metrics (change, %, high, low)
- Smooth animations and responsive design

**Props**:
- `portfolioHistory`: Array of {date, value} objects

### 3. AlertsPanel.jsx
**Purpose**: Real-time alert notifications and management
**Features**:
- Color-coded severity levels
- Filterable by severity
- Dismissible alerts
- Action recommendations
- 24-hour alert retention

**Props**:
- `alerts`: Array of alert objects
- `onDismiss`: Callback to dismiss alerts

### 4. CategoryDashboards.jsx
**Purpose**: Detailed breakdown by asset type
**Features**:
- Tabbed interface (Layer 1, AI, Usability, Memes)
- Individual asset cards with metrics
- Category totals
- 24h price changes

**Props**:
- `holdings`: Asset holdings
- `prices`: Current prices

### 5. PortfolioIndicators.jsx
**Purpose**: Advanced portfolio metrics
**Features**:
- Sharpe Ratio calculation
- 30-day volatility index
- Performance score
- Color-coded risk indicators

**Props**:
- `portfolioHistory`: Historical data
- `returns`: Array of daily returns

## Services

### cryptoApi.js
**Purpose**: CoinGecko API integration with intelligent caching

**Key Methods**:
```javascript
getPrices(symbols)           // Fetch current prices
getHistoricalData(symbol)    // Get price history
getMarketData(symbol)        // Get detailed market data
getTrendingCoins()          // Get trending coins
```

**Features**:
- 1-minute cache to respect API limits
- Batch price fetching
- Error handling
- Automatic retry logic

### alertService.js
**Purpose**: Alert generation and monitoring

**Key Methods**:
```javascript
checkPriceMovements()        // Monitor price changes
checkAllocationDeviations()  // Track allocation drift
checkPortfolioValue()        // Monitor portfolio value
checkSharpeRatio()          // Risk-adjusted returns
checkVolatility()           // Volatility monitoring
runAllChecks()              // Execute all checks
```

**Alert Types**:
- Price movements (±5%, ±10%, ±30%)
- Allocation deviations (>5% from target)
- Portfolio value changes (±10%, +20%)
- Sharpe Ratio below threshold
- High volatility warnings

## Utilities

### portfolioCalculations.js
**Financial Calculation Functions**:

```javascript
calculateSharpeRatio(returns)            // Risk-adjusted returns
calculateVolatility(prices)              // 30-day rolling volatility
calculateCorrelation(prices1, prices2)   // Asset correlation
calculateAllocations(holdings, prices)   // Current allocations
calculateAllocationDeviation()           // Deviation from target
calculatePortfolioValue()                // Historical portfolio value
calculatePnL()                           // Profit & Loss
groupByCategory()                        // Group assets by category
groupByType()                           // Group by asset type
formatCurrency()                        // Format as USD
formatPercentage()                      // Format as percentage
formatNumber()                          // Format large numbers (K, M, B)
```

## Configuration

### Portfolio Configuration (types/portfolio.js)

**Asset Categories**:
- `BTC_ETH`: Bitcoin & Ethereum (10% target)
- `MID_LOW_CAP`: Mid-to-low cap altcoins (50% target)
- `MEMECOINS`: Meme coins (10% target)
- `STABLECOINS`: Stable coins (30% target)

**Asset Types**:
- `LAYER1`: Layer 1 blockchains
- `AI`: AI-related projects
- `USABILITY`: Real-world use cases
- `MEME`: Meme coins
- `STABLE`: Stablecoins

**Risk Tiers**:
- `SAFEST`: Low risk (LINK, SOL, SUI, BTC, ETH)
- `MODERATE`: Medium risk (AVAX, XRP, DOT, FET, RNDR)
- `RISKY`: High risk (DOGE, SHIB, PEPE, MONK, MUMU)

**Each Asset Configured With**:
- Symbol and name
- Category and type
- Target allocation percentage
- Risk tier
- CoinGecko API mapping

### Alert Configuration

**Price Movement Thresholds**:
- 5% movement: Low severity
- 10% movement: High severity
- 30% gain: Critical (cashout recommendation)

**Portfolio Thresholds**:
- +20% portfolio value: Medium alert
- -10% portfolio value: Critical alert
- 5% allocation deviation: Rebalancing alert

**Performance Thresholds**:
- Sharpe Ratio < 1.0: High alert
- Volatility > 50%: High alert

## Data Flow

1. **Initial Load**:
   - App fetches prices from CoinGecko API
   - Calculates portfolio metrics
   - Initializes alert monitoring

2. **Periodic Updates** (Every 60 seconds):
   - Refresh price data
   - Update portfolio history
   - Calculate new returns
   - Run alert checks
   - Update UI

3. **User Interactions**:
   - Manual refresh button
   - Timeframe selection
   - Category tab switching
   - Alert dismissal

4. **Alert Generation**:
   - Price data updates trigger checks
   - Alerts generated based on thresholds
   - Duplicate prevention (1-hour window)
   - Auto-cleanup (24-hour retention)

## State Management

**Main App State**:
```javascript
holdings          // User's cryptocurrency holdings
prices           // Current price data
portfolioHistory // Historical portfolio values
returns          // Daily return calculations
alerts           // Active alerts
loading          // Loading state
lastUpdate       // Last data refresh time
```

**Component State**:
- Timeframe selection
- Alert filters
- Active tab selection

## Styling

**Color Scheme**:
- Background: Dark blue (`#0f172a`)
- Cards: Slate (`#1e293b`)
- Accent: Blue (`#3b82f6`)
- Success: Green (`#10b981`)
- Danger: Red (`#ef4444`)
- Warning: Yellow/Orange

**Responsive Design**:
- Mobile-first approach
- Grid layouts with Tailwind
- Collapsible sections
- Touch-friendly controls

## API Integration

**CoinGecko Free Tier**:
- Rate limit: 10-50 calls/minute
- No API key required
- 1-minute caching implemented
- Batch requests for efficiency

**Endpoints Used**:
- `/simple/price`: Current prices
- `/coins/{id}/market_chart`: Historical data
- `/coins/{id}`: Detailed market data
- `/search/trending`: Trending coins

## Performance Optimizations

1. **API Caching**: 1-minute cache reduces API calls
2. **Batch Requests**: Single call for all prices
3. **React Optimizations**: Memo, useCallback where appropriate
4. **Data Slicing**: Keep only last 365 days of history
5. **Lazy Loading**: Components load on demand

## Security Considerations

1. **No Private Keys**: Dashboard is view-only
2. **Client-Side Only**: No backend, no data storage
3. **API Rate Limiting**: Respects CoinGecko limits
4. **No Sensitive Data**: Holdings are local only

## Deployment Options

**Static Hosting** (Recommended):
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Build Command**: `npm run build`
**Output Directory**: `dist/`

## Future Enhancements

**Planned Features**:
- LocalStorage persistence
- Transaction history tracking
- Multiple portfolio support
- Tax reporting
- DeFi integration
- Push notifications
- Mobile app
- Social features

## Development Commands

```bash
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Android

## Dependencies

**Production**:
- react, react-dom: UI framework
- chart.js, react-chartjs-2: Charts
- axios: HTTP client
- lucide-react: Icons
- date-fns: Date utilities
- lodash: Utility functions

**Development**:
- vite: Build tool
- tailwindcss: CSS framework
- eslint: Linting
- autoprefixer: CSS processing

---

**Last Updated**: December 2025
**Version**: 1.0.0
**License**: MIT
