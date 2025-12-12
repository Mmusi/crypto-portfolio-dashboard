# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies

Open PowerShell and run:

```powershell
cd C:\Users\mmusi\source\repos\crypto-portfolio-dashboard
npm install
```

### 2. Configure Your Holdings

Edit `src/App.jsx` and update the `holdings` object with your actual cryptocurrency amounts:

```javascript
const [holdings, setHoldings] = useState({
  BTC: 0.5,       // 0.5 Bitcoin
  ETH: 2,         // 2 Ethereum
  SOL: 50,        // 50 Solana
  LINK: 100,      // 100 Chainlink
  // ... update with your actual holdings
});
```

### 3. Start the Dashboard

```powershell
npm run dev
```

The dashboard will open automatically in your browser at `http://localhost:3000`

## What You'll See

### Dashboard Sections:

1. **Portfolio Overview** (Top)
   - Total portfolio value
   - 24-hour performance
   - Asset allocation pie chart
   - Risk distribution

2. **Active Alerts** (If any)
   - Price movement notifications
   - Allocation deviation warnings
   - Portfolio value changes

3. **Performance Charts**
   - Historical portfolio value
   - Selectable timeframes (7d, 30d, 90d, 1y)
   - Period highs and lows

4. **Portfolio Indicators**
   - Sharpe Ratio
   - 30-day volatility
   - Performance score

5. **Category Dashboards**
   - Tabbed view by asset type
   - Layer 1, AI, Usability, Memes

## Key Features to Try

### Refresh Data
Click the **Refresh** button in the header to manually update prices

### Persist Holdings
Open the **Manage** button in the header to add, edit, or remove holdings; changes are saved to the browser's IndexedDB and will persist across sessions.

### Daily Earnings
Open the **Earnings** button in the header to add daily earnings (date, platform, token, amount, category, notes). Amounts are converted to USDT automatically using CoinGecko and persisted to IndexedDB. Use the `Load` button inside the modal to reload saved entries for the selected date.

### Trades
Open the **Trades** button in the header to add trades (date, exchange, pair, type, direction, entry/exit price, size). PNL is computed automatically and saved to the `trades` store. Use the modal to edit or delete trades for a given date.

### Alert Settings
Open **Settings** in the header to edit alert thresholds (price movement, allocation deviation, portfolio value, Sharpe ratio, volatility). Changes are saved to IndexedDB and applied immediately to alert checks.

### Switch Timeframes
In the Performance Charts section, click different timeframe buttons (7d, 30d, 90d, 1y)

### Explore Categories
Click through the tabs in Category Dashboards to see:
- Layer 1: Blockchain platforms
- AI Coins: AI-related projects
- Usability: Real-world use cases
- Memes: Speculative meme coins

### Monitor Alerts
When market conditions trigger alerts, they'll appear with:
- Severity level (Critical, High, Medium, Low)
- Recommended actions
- Dismiss button

## Customization Tips

### Change Alert Thresholds

Edit `src/services/alertService.js`:

```javascript
this.alertConfig = {
  priceMovement: {
    threshold10: 0.10,  // Alert on 10% moves
    threshold30: 0.30   // Alert on 30% gains
  }
}
```

### Add New Cryptocurrencies

1. Add to `src/types/portfolio.js` PORTFOLIO_CONFIG
2. Add CoinGecko ID in `src/services/cryptoApi.js`
3. Add to holdings in `src/App.jsx`

### Adjust Target Allocations

In `src/types/portfolio.js`, modify `targetAllocation` for each asset:

```javascript
SOL: {
  symbol: 'SOL',
  name: 'Solana',
  targetAllocation: 0.10,  // 10% of portfolio
  // ...
}
```

## Troubleshooting

### Dashboard won't load prices
- Check your internet connection
- CoinGecko API may be rate-limited (wait 1 minute)
- Check browser console for errors (F12)

### Missing asset prices
- Verify the CoinGecko ID is correct in `cryptoApi.js`
- Some assets may not be on CoinGecko free tier

### Alerts not showing
- Alerts only trigger when thresholds are met
- Check `alertService.js` configuration
- Price movements must exceed configured percentages

## Data Updates

- **Automatic**: Every 60 seconds
- **Manual**: Click "Refresh" button
- **Cache**: 1 minute (respects API limits)

## Next Steps

1. **Customize your portfolio** with real holdings
2. **Adjust alert thresholds** to match your risk tolerance
3. **Monitor performance** across different timeframes
4. **Track category performance** to identify trends
5. **Review alerts** for actionable insights

## Building for Production

```powershell
npm run build
```

Output will be in the `dist` folder, ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

---

**Need Help?** Check README.md for detailed documentation.
