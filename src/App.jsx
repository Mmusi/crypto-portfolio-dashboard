import React, { useState, useEffect } from 'react';
import PortfolioOverview from './components/PortfolioOverview';
import PerformanceCharts from './components/PerformanceCharts';
import AlertsPanel from './components/AlertsPanel';
import CategoryDashboards from './components/CategoryDashboards';
import PortfolioIndicators from './components/PortfolioIndicators';
import cryptoApi from './services/cryptoApi';
import alertService from './services/alertService';
import { calculateAllocations, formatCurrency, setDisplayCurrency } from './utils/portfolioCalculations';
import { PORTFOLIO_CONFIG } from './types/portfolio';
import { Wallet, RefreshCw } from 'lucide-react';
import HoldingsManager from './components/HoldingsManager';
import DailyEarningsManager from './components/DailyEarningsManager';
import TradesManager from './components/TradesManager';
import ActivitiesManager from './components/ActivitiesManager';
import capitalBuildingDB from './services/capitalBuildingDb';
import AlertSettings from './components/AlertSettings';

function App() {
  // Start with empty holdings (user requested starting from zero)
  const [holdings, setHoldings] = useState({});

  const [prices, setPrices] = useState({});
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [returns, setReturns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showHoldingsManager, setShowHoldingsManager] = useState(false);
  const [showEarningsManager, setShowEarningsManager] = useState(false);
  const [baseHoldings, setBaseHoldings] = useState({});
  const [earningsSummary, setEarningsSummary] = useState({ totalToday: 0, total7: 0 });
  const [tradeSummary, setTradeSummary] = useState(null);
  const [showTradesManager, setShowTradesManager] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [displayCurrency, setDisplayCurrencyState] = useState('USD');
  const [holdingsLastUpdated, setHoldingsLastUpdated] = useState(null);
  const [showActivitiesManager, setShowActivitiesManager] = useState(false);
  const [activitiesSummary, setActivitiesSummary] = useState({ totalToday: 0, total7: 0 });
  const [fxInfo, setFxInfo] = useState({ rate: null, lastUpdated: null });

  // Fetch prices on mount and periodically
  useEffect(() => {
    // Initialize IndexedDB and load persisted holdings (if any)
    const setup = async () => {
      try {
        await capitalBuildingDB.init();
        // Load baseHoldings if present; otherwise set baseHoldings from persisted 'holdings' or current holdings
        const persisted = await capitalBuildingDB.getSetting('holdings');
        const base = await capitalBuildingDB.getSetting('baseHoldings');
        if (base && Object.keys(base).length > 0) {
          setBaseHoldings(base);
        } else if (persisted && Object.keys(persisted).length > 0) {
          setBaseHoldings(persisted);
          await capitalBuildingDB.saveSetting('baseHoldings', persisted);
        } else {
          setBaseHoldings(holdings);
          await capitalBuildingDB.saveSetting('baseHoldings', holdings);
        }

        // If persisted holdings exists (computed), use it
        if (persisted && Object.keys(persisted).length > 0) {
          setHoldings(persisted);
        }
      } catch (err) {
        console.warn('IndexedDB init/load failed:', err);
      }

      // Load summaries
      // Load display currency preference
      try {
        const dc = await capitalBuildingDB.getSetting('displayCurrency');
        if (dc) {
          setDisplayCurrencyState(dc);
          const { setDisplayCurrency } = await import('./utils/portfolioCalculations');
          setDisplayCurrency(dc);
        }
      } catch (err) {
        console.warn('Error loading display currency setting', err);
      }

      // Initialize FX service and fetch rates if needed
      try {
          await fxService.init('USD', 'BWP');
          // update fx info in state
          const info = fxService.getLatestRate('USD', 'BWP');
          setFxInfo({ rate: info.rate, lastUpdated: info.lastUpdated });
          // Also schedule periodic refresh (update state each run)
          setInterval(async () => {
            await fxService.init('USD', 'BWP');
            const updated = fxService.getLatestRate('USD', 'BWP');
            setFxInfo({ rate: updated.rate, lastUpdated: updated.lastUpdated });
          }, 10 * 60 * 1000);
      } catch (err) {
        console.warn('Error initializing FX service', err);
      }

      await loadEarningsSummary();
      await recomputeHoldingsFromEarnings();
      await loadTradeSummary();
      await loadActivitiesSummary();
      // Load holdings last-updated
      try {
        const hUpdated = await capitalBuildingDB.getSetting('holdingsLastUpdated');
        if (hUpdated) setHoldingsLastUpdated(hUpdated);
      } catch (err) {
        console.warn('Error loading holdingsLastUpdated', err);
      }

      // Start price fetch loop
      fetchPrices();
    };

    setup();
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

  const handleOpenHoldingsManager = () => setShowHoldingsManager(true);
  const handleCloseHoldingsManager = () => setShowHoldingsManager(false);
  const handleSaveHoldings = async (newHoldings) => {
    setHoldings(newHoldings);
    try {
      await capitalBuildingDB.saveSetting('holdings', newHoldings);
      console.log('App: holdings saved', newHoldings);
      // Update baseHoldings when user explicitly manages holdings
      await capitalBuildingDB.saveSetting('baseHoldings', newHoldings);
      setBaseHoldings(newHoldings);
      // Save last updated timestamp for holdings
      const now = new Date().toISOString();
      await capitalBuildingDB.saveSetting('holdingsLastUpdated', now);
      setHoldingsLastUpdated(now);
    } catch (err) {
      console.error('Error saving holdings to DB:', err);
    }
    setShowHoldingsManager(false);
  };

  // Recompute holdings from baseHoldings + all earnings (sum by token)
  const recomputeHoldingsFromEarnings = async () => {
    try {
      const allEarnings = await capitalBuildingDB.getAll('earnings');
      const totalsByToken = {};
      allEarnings.forEach(e => {
        const t = (e.tokenName || '').toUpperCase();
        if (!t) return;
        totalsByToken[t] = (totalsByToken[t] || 0) + (Number(e.amountToken) || 0);
      });

      // Per user request, holdings should reflect earnings ONLY (no merge with baseHoldings)
      const newHoldings = {};
      Object.entries(totalsByToken).forEach(([token, amt]) => {
        newHoldings[token] = amt;
      });

      setHoldings(newHoldings);
      await capitalBuildingDB.saveSetting('holdings', newHoldings);
      const now = new Date().toISOString();
      await capitalBuildingDB.saveSetting('holdingsLastUpdated', now);
      setHoldingsLastUpdated(now);
      console.log('Recomputed holdings from earnings', newHoldings);
    } catch (err) {
      console.error('Error recomputing holdings:', err);
    }
  };

  const loadEarningsSummary = async () => {
    try {
      // Today's earnings
      const today = new Date().toISOString().split('T')[0];
      const todays = await capitalBuildingDB.getEarningsByDate(today);
      const totalToday = (todays || []).reduce((s, e) => s + (e.amountUSDT || 0), 0);

      // Last 7 days
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const range = await capitalBuildingDB.getEarningsByDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
      const total7 = (range || []).reduce((s, e) => s + (e.amountUSDT || 0), 0);

      setEarningsSummary({ totalToday, total7 });
    } catch (err) {
      console.error('Error loading earnings summary:', err);
    }
  };

  const loadTradeSummary = async () => {
    try {
      const perf = await capitalBuildingDB.getTradePerformance();
      setTradeSummary(perf);
    } catch (err) {
      console.error('Error loading trade summary:', err);
    }
  };

  const handleOpenActivitiesManager = () => setShowActivitiesManager(true);
  const handleCloseActivitiesManager = () => setShowActivitiesManager(false);

  const loadActivitiesSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todays = await capitalBuildingDB.getActivitiesByDate(today);
      const totalToday = (todays || []).reduce((s, e) => s + (e.amountUSDT || 0), 0);

      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const range = await capitalBuildingDB.getActivitiesByDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
      const total7 = (range || []).reduce((s, e) => s + (e.amountUSDT || 0), 0);

      setActivitiesSummary({ totalToday, total7 });
    } catch (err) {
      console.error('Error loading activities summary:', err);
    }
  };

  const handleOpenEarningsManager = () => setShowEarningsManager(true);
  const handleCloseEarningsManager = () => setShowEarningsManager(false);
  const handleOpenTradesManager = () => setShowTradesManager(true);
  const handleCloseTradesManager = () => setShowTradesManager(false);

  const handleOpenAlertSettings = () => setShowAlertSettings(true);
  const handleCloseAlertSettings = () => setShowAlertSettings(false);

  const { totalValue } = calculateAllocations(holdings, prices);

  return (
    <div className="min-h-screen bg-crypto-dark">
      {/* Header */}
      <header className="bg-crypto-card border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-crypto-blue mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">Crypto Portfolio Dashboard</h1>
                <nav className="mt-2">
                  <ul className="flex space-x-6 text-sm">
                    <li className="text-gray-300 hover:text-white cursor-pointer" onClick={handleOpenEarningsManager}>Earnings</li>
                    <li className="text-gray-300 hover:text-white cursor-pointer" onClick={handleOpenTradesManager}>Trades</li>
                    <li className="text-gray-300 hover:text-white cursor-pointer" onClick={handleOpenActivitiesManager}>Activities</li>
                    <li className="text-gray-300 hover:text-white cursor-pointer" onClick={handleOpenHoldingsManager}>Holdings</li>
                  </ul>
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-gray-400 text-xs">Last Updated</p>
                <p className="text-white text-sm">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
                {displayCurrency === 'BWP' && fxInfo?.rate && (
                  <div className="text-xs text-gray-400 ml-4">1 USD = {fxInfo.rate.toFixed(2)} BWP (updated {fxInfo.lastUpdated ? new Date(fxInfo.lastUpdated).toLocaleTimeString() : 'unknown'})</div>
                )}

              <button
                onClick={fetchPrices}
                disabled={loading}
                className="bg-crypto-blue hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="ml-3">
                <select value={displayCurrency} onChange={async (e) => {
                  const val = e.target.value;
                  setDisplayCurrencyState(val);
                  // persist
                  try { await capitalBuildingDB.saveSetting('displayCurrency', val); } catch (err) { console.error('Error saving currency setting', err); }
                  // update module-level formatter
                  const { setDisplayCurrency } = await import('./utils/portfolioCalculations');
                  setDisplayCurrency(val);
                  // if switching to BWP, ensure FX rates are fetched
                  if (val === 'BWP') {
                    try {
                      await fxService.init('USD', 'BWP');
                      const updated = fxService.getLatestRate('USD', 'BWP');
                      setFxInfo({ rate: updated.rate, lastUpdated: updated.lastUpdated });
                    } catch (err) {
                      console.warn('Error fetching FX rate on currency change', err);
                    }
                  }
                }} className="bg-gray-700 text-white px-2 py-1 rounded">
                  <option value="USD">$ USD</option>
                  <option value="BWP">BWP</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && Object.keys(prices).length === 0 ? (
          <div className="flex items-center justify-center h-96">
              <div className="text-right">
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
              holdingsLastUpdated={holdingsLastUpdated}
            />

            {/* Alerts Panel */}
            {alerts.length > 0 && (
              <AlertsPanel 
                alerts={alerts}
                onDismiss={handleDismissAlert}
              />
            )}

            {/* Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-crypto-card p-4 rounded-lg border border-gray-700 text-white">
                <div className="text-sm text-gray-400">Portfolio Value</div>
                <div className="text-xl font-bold">{typeof totalValue === 'number' ? formatCurrency(totalValue) : '-'}</div>
              </div>

              <div className="bg-crypto-card p-4 rounded-lg border border-gray-700 text-white">
                <div className="text-sm text-gray-400">Earnings Today</div>
                <div className="text-xl font-bold">{earningsSummary?.totalToday ? formatCurrency(earningsSummary.totalToday) : formatCurrency(0)}</div>
              </div>

              <div className="bg-crypto-card p-4 rounded-lg border border-gray-700 text-white">
                <div className="text-sm text-gray-400">Earnings (7d)</div>
                <div className="text-xl font-bold">{earningsSummary?.total7 ? formatCurrency(earningsSummary.total7) : formatCurrency(0)}</div>
              </div>

              <div className="bg-crypto-card p-4 rounded-lg border border-gray-700 text-white">
                <div className="text-sm text-gray-400">Activities Today</div>
                <div className="text-xl font-bold">{activitiesSummary?.totalToday ? formatCurrency(activitiesSummary.totalToday) : formatCurrency(0)}</div>
              </div>

              <div className="bg-crypto-card p-4 rounded-lg border border-gray-700 text-white">
                <div className="text-sm text-gray-400">Trades PNL</div>
                <div className="text-xl font-bold">{tradeSummary ? formatCurrency(tradeSummary.totalPNL) : formatCurrency(0)}</div>
              </div>
            </div>

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

      {showHoldingsManager && (
        <HoldingsManager
          holdings={holdings}
          onSave={handleSaveHoldings}
          onClose={handleCloseHoldingsManager}
        />
      )}

      {showEarningsManager && (
        <DailyEarningsManager
          onClose={handleCloseEarningsManager}
          onSaved={async (payload, { action }) => {
            // When earnings change, recompute holdings, reload summaries, and refresh prices
            await recomputeHoldingsFromEarnings();
            await loadEarningsSummary();
            await loadTradeSummary();
            fetchPrices();
          }}
        />
      )}

      {showActivitiesManager && (
        <ActivitiesManager onClose={handleCloseActivitiesManager} onSaved={async (payload, { action }) => {
          await loadActivitiesSummary();
          fetchPrices();
        }} />
      )}

      {showTradesManager && (
        <TradesManager onClose={handleCloseTradesManager} onSaved={async (payload, { action }) => {
          // When trades change, refresh trade summary and prices
          await loadTradeSummary();
          fetchPrices();
        }} />
      )}
      {showAlertSettings && (
        <AlertSettings onClose={handleCloseAlertSettings} />
      )}
    </div>
  );
}

export default App;
