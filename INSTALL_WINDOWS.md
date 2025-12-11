# Windows Installation Guide

## Prerequisites

Make sure you have Node.js installed. If not:
1. Download from https://nodejs.org/ (LTS version recommended)
2. Run the installer
3. Verify installation:
```powershell
node --version
npm --version
```

## Installation Steps

### 1. Open PowerShell

Press `Win + X` and select "Windows PowerShell" or "Terminal"

### 2. Navigate to Project Directory

```powershell
cd C:\Users\mmusi\source\repos\crypto-portfolio-dashboard
```

### 3. Install Dependencies

```powershell
npm install
```

This will install all required packages:
- React and React DOM
- Chart.js for visualizations
- TailwindCSS for styling
- Axios for API calls
- Lucide React for icons
- And more...

**Expected time**: 2-3 minutes depending on internet speed

### 4. Start the Development Server

```powershell
npm run dev
```

You should see output like:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 5. Open in Browser

The dashboard should automatically open in your default browser at:
```
http://localhost:3000
```

If it doesn't open automatically, manually navigate to that URL.

## Troubleshooting

### Issue: "npm: command not found"
**Solution**: Node.js is not installed or not in PATH
- Reinstall Node.js from https://nodejs.org/
- Make sure to check "Add to PATH" during installation
- Restart PowerShell after installation

### Issue: Port 3000 is already in use
**Solution**: Another application is using port 3000
```powershell
# Kill the process using port 3000
netstat -ano | findstr :3000
# Note the PID (last column)
taskkill /PID <PID> /F
```

Or change the port in `vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to any available port
  open: true
}
```

### Issue: Dependencies won't install
**Solution**: Clear npm cache and try again
```powershell
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install
```

### Issue: CORS or API errors
**Solution**: CoinGecko API may be rate-limited
- Wait 1 minute and refresh
- Check internet connection
- Verify API is accessible: https://api.coingecko.com/api/v3/ping

### Issue: Module not found errors
**Solution**: Ensure all files are in correct locations
```powershell
# Verify project structure
tree /F src
```

All component files should be in `src/components/`
All service files should be in `src/services/`

### Issue: Styles not loading
**Solution**: Rebuild Tailwind CSS
```powershell
npm run dev
# If that doesn't work:
rm -r node_modules/.vite
npm run dev
```

## Next Steps

### 1. Customize Your Portfolio

Edit `src/App.jsx` and change the holdings:

```javascript
const [holdings, setHoldings] = useState({
  BTC: 0.5,    // Your Bitcoin amount
  ETH: 2,      // Your Ethereum amount
  SOL: 50,     // Your Solana amount
  // ... update with your actual holdings
});
```

### 2. Test the Dashboard

- Check if all sections load correctly
- Click the Refresh button
- Switch between timeframes
- Explore category tabs

### 3. Monitor for Alerts

Alerts will appear when:
- Prices move significantly
- Allocations deviate from targets
- Portfolio value changes dramatically

### 4. Build for Production (Optional)

When ready to deploy:

```powershell
npm run build
```

This creates an optimized build in the `dist/` folder.

## Development Tips

### Hot Reload
Changes to source files automatically reload the browser. No need to restart the dev server.

### Component Location
All React components are in `src/components/`:
- PortfolioOverview.jsx
- PerformanceCharts.jsx
- AlertsPanel.jsx
- CategoryDashboards.jsx
- PortfolioIndicators.jsx

### Configuration Files
- Portfolio setup: `src/types/portfolio.js`
- Alert rules: `src/services/alertService.js`
- API mappings: `src/services/cryptoApi.js`

### Styling
- Global styles: `src/index.css`
- Tailwind config: `tailwind.config.js`
- Custom colors defined in tailwind config

## Performance Notes

### First Load
- Initial load fetches prices for all assets
- May take 2-3 seconds depending on API response
- Loading spinner shows during fetch

### Automatic Updates
- Prices refresh every 60 seconds automatically
- Portfolio history accumulates over time
- Alerts checked on each update

### Browser Console
Press `F12` to open Developer Tools and check:
- Network requests
- Console errors
- Performance metrics

## Recommended Browser

**Chrome or Edge (Chromium)** - Best performance
- Full Chart.js support
- Better developer tools
- Automatic updates

Also works well on:
- Firefox
- Brave
- Opera

## File Locations

**Project Root**: `C:\Users\mmusi\source\repos\crypto-portfolio-dashboard\`

**Key Files**:
- Main app: `src\App.jsx`
- Entry point: `src\main.jsx`
- Styles: `src\index.css`
- Components: `src\components\`
- Services: `src\services\`

## Getting Help

### Documentation
- README.md - Full feature documentation
- QUICKSTART.md - Quick start guide
- PROJECT_STRUCTURE.md - Technical architecture

### Common Commands
```powershell
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm install       # Install/update dependencies
```

### Logs
If something goes wrong, check:
1. PowerShell output for error messages
2. Browser console (F12) for runtime errors
3. Network tab (F12) for API issues

## Success Indicators

You'll know everything is working when you see:
- ✅ Portfolio value displayed
- ✅ Allocation pie chart rendered
- ✅ Risk tiers showing with percentages
- ✅ Performance chart with data
- ✅ Category dashboards populated
- ✅ No errors in browser console

## Quick Reference

**Start Dashboard**:
```powershell
cd C:\Users\mmusi\source\repos\crypto-portfolio-dashboard
npm run dev
```

**Stop Dashboard**:
Press `Ctrl + C` in PowerShell window

**Update Dependencies**:
```powershell
npm update
```

**Clear Cache**:
```powershell
npm cache clean --force
```

---

**Need more help?** Check the full README.md or open an issue on GitHub.

**Ready to trade!** 🚀📈
