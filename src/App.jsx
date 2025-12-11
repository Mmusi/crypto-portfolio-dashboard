import React, { useState, useEffect } from 'react';
import PortfolioOverview from './components/PortfolioOverview';
import PerformanceCharts from './components/PerformanceCharts';
import AlertsPanel from './components/AlertsPanel';
import CategoryDashboards from './components/CategoryDashboards';
import PortfolioIndicators from './components/PortfolioIndicators';
import cryptoApi from './services/cryptoApi';
import alertService from './services/alertService';
import { calculateAllocations } from './utils/portfolioCalculations';
import { PORTFOLIO_CONFIG } from './types/portfolio';
import { Wallet, RefreshCw } from 'lucide-react';

function App() {
  const [holdings, setHoldings] = useState({
    // Sample holdings - you can modify these
    BTC: 0.5,
    ETH: 2,
    SOL: 50,
    LINK: 100,
    SUI: 200,
    AVAX: 30,
    XRP: 500,
    DOT: 50,
    FET: 150,
    RNDR: 100,
    DOGE: 1000,
    SHIB: 5000000,
    PEPE: 10000000,
    USDT: 5000,
    USDC: 5000
  });

  const [prices, setPrices] = useState({});
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [returns, setReturns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch prices on mount and periodically
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Run alert checks when prices update
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const newAlerts = alertService.runAllChecks(holdings, prices, {}, portfolioHistory);
      setAlerts(newAlerts);
    }
  }, [prices, holdings, portfolioHistory]);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const symbols = Object.keys(holdings);
      const priceData = await cryptoApi.getPrices(symbols);
      setPrices(priceData);
      setLastUpdate(new Date());
      
      // Calculate current portfolio value for history
      const { totalValue } = calculateAllocations(holdings, priceData);
      setPortfolioHistory(prev => [
        ...prev,
        { date: new Date(), value: totalValue }
      ].slice(-365)); // Keep last year of data
      
      // Calculate returns (simplified)
      if (portfolioHistory.length > 0) {
        const prevValue = portfolioHistory[portfolioHistory.length - 1]?.value || totalValue;
        const dailyReturn = prevValue > 0 ? (totalValue - prevValue) / prevValue : 0;
        setReturns(prev => [...prev, dailyReturn].slice(-365));
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId) => {
    alertService.dismissAlert(alertId);
    setAlerts(alertService.getActiveAlerts());
  };

  const { totalValue } = calculateAllocations(holdings, prices);

  return (
    <div className="min-h-screen bg-crypto-dark">
      {/* Header */}
      <header className="bg-crypto-card border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-crypto-blue mr-3" />
              <h1 className="text-2xl font-bold text-white">Crypto Portfolio Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-400 text-xs">Last Updated</p>
                <p className="text-white text-sm">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
              <button
                onClick={fetchPrices}
                disabled={loading}
                className="bg-crypto-blue hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && Object.keys(prices).length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-crypto-blue animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading portfolio data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview 
              holdings={holdings}
              prices={prices}
              totalValue={totalValue}
            />

            {/* Alerts Panel */}
            {alerts.length > 0 && (
              <AlertsPanel 
                alerts={alerts}
                onDismiss={handleDismissAlert}
              />
            )}

            {/* Performance Charts */}
            <PerformanceCharts portfolioHistory={portfolioHistory} />

            {/* Portfolio Indicators */}
            <PortfolioIndicators 
              portfolioHistory={portfolioHistory}
              returns={returns}
            />

            {/* Category Dashboards */}
            <CategoryDashboards 
              holdings={holdings}
              prices={prices}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-crypto-card border-t border-gray-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Crypto Portfolio Dashboard - Real-time monitoring and alerts</p>
          <p className="mt-1">Data provided by CoinGecko API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
