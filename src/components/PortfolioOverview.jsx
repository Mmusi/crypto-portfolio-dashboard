import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign, Shield, AlertTriangle, Zap } from 'lucide-react';
import { formatCurrency, formatPercentage, groupByCategory } from '../utils/portfolioCalculations';
import { PORTFOLIO_CONFIG, RISK_TIERS } from '../types/portfolio';

ChartJS.register(ArcElement, Tooltip, Legend);

const PortfolioOverview = ({ holdings, prices, totalValue }) => {
  const categorizedAssets = groupByCategory(null, holdings, prices, PORTFOLIO_CONFIG);
  
  // Calculate category allocations
  const categoryData = Object.entries(categorizedAssets).map(([category, data]) => ({
    category,
    value: data.totalValue,
    percentage: totalValue > 0 ? (data.totalValue / totalValue) * 100 : 0
  }));

  // Group by risk tier
  const riskTiers = {
    [RISK_TIERS.SAFEST]: { value: 0, assets: [] },
    [RISK_TIERS.MODERATE]: { value: 0, assets: [] },
    [RISK_TIERS.RISKY]: { value: 0, assets: [] }
  };

  Object.entries(holdings).forEach(([symbol, amount]) => {
    const config = PORTFOLIO_CONFIG.assets[symbol];
    if (!config) return;
    
    const price = prices[symbol]?.price || 0;
    const value = amount * price;
    
    riskTiers[config.risk].value += value;
    riskTiers[config.risk].assets.push({
      symbol,
      name: config.name,
      value
    });
  });

  // Pie chart data
  const chartData = {
    labels: categoryData.map(d => {
      const labels = {
        'btc_eth': 'BTC & ETH',
        'mid_low_cap': 'Mid-Low Cap Altcoins',
        'memecoins': 'Memecoins',
        'stablecoins': 'Stablecoins'
      };
      return labels[d.category] || d.category;
    }),
    datasets: [{
      data: categoryData.map(d => d.value),
      backgroundColor: [
        '#3b82f6', // Blue for BTC/ETH
        '#10b981', // Green for Mid-cap
        '#f59e0b', // Orange for Memes
        '#6366f1'  // Indigo for Stables
      ],
      borderColor: '#1e293b',
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = totalValue > 0 ? (value / totalValue * 100).toFixed(2) : 0;
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Calculate 24h change
  const portfolio24hChange = Object.entries(holdings).reduce((sum, [symbol, amount]) => {
    const priceData = prices[symbol];
    if (!priceData) return sum;
    
    const currentValue = amount * priceData.price;
    const previousValue = currentValue / (1 + (priceData.change24h / 100));
    return sum + (currentValue - previousValue);
  }, 0);

  const portfolio24hChangePercent = totalValue > 0 ? (portfolio24hChange / (totalValue - portfolio24hChange)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-crypto-card to-crypto-dark p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
            <h2 className="text-4xl font-bold text-white">{formatCurrency(totalValue)}</h2>
            <div className="flex items-center mt-2">
              {portfolio24hChangePercent >= 0 ? (
                <TrendingUp className="w-5 h-5 text-crypto-green mr-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-crypto-red mr-2" />
              )}
              <span className={`text-lg font-semibold ${portfolio24hChangePercent >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
                {formatPercentage(portfolio24hChangePercent)}
              </span>
              <span className="text-gray-400 text-sm ml-2">24h</span>
            </div>
          </div>
          <DollarSign className="w-16 h-16 text-gray-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Pie Chart */}
        <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Portfolio Allocation</h3>
          <div className="h-80">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Risk Tiering */}
        <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Risk Distribution</h3>
          <div className="space-y-4">
            {/* Safest */}
            <div className="border border-green-600 bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-400 font-semibold">Safest</span>
                </div>
                <span className="text-white font-bold">
                  {formatCurrency(riskTiers[RISK_TIERS.SAFEST].value)}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {riskTiers[RISK_TIERS.SAFEST].assets.map(a => a.name).join(', ')}
              </div>
              <div className="mt-2">
                <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full"
                    style={{ width: `${totalValue > 0 ? (riskTiers[RISK_TIERS.SAFEST].value / totalValue * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {totalValue > 0 ? ((riskTiers[RISK_TIERS.SAFEST].value / totalValue) * 100).toFixed(1) : 0}% of portfolio
                </span>
              </div>
            </div>

            {/* Moderate */}
            <div className="border border-yellow-600 bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-yellow-400 font-semibold">Moderate</span>
                </div>
                <span className="text-white font-bold">
                  {formatCurrency(riskTiers[RISK_TIERS.MODERATE].value)}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {riskTiers[RISK_TIERS.MODERATE].assets.map(a => a.name).join(', ')}
              </div>
              <div className="mt-2">
                <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full rounded-full"
                    style={{ width: `${totalValue > 0 ? (riskTiers[RISK_TIERS.MODERATE].value / totalValue * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {totalValue > 0 ? ((riskTiers[RISK_TIERS.MODERATE].value / totalValue) * 100).toFixed(1) : 0}% of portfolio
                </span>
              </div>
            </div>

            {/* Risky */}
            <div className="border border-red-600 bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400 font-semibold">Risky</span>
                </div>
                <span className="text-white font-bold">
                  {formatCurrency(riskTiers[RISK_TIERS.RISKY].value)}
                </span>
              </div>
              <div className="text-sm text-gray-300">
                {riskTiers[RISK_TIERS.RISKY].assets.map(a => a.name).join(', ')}
              </div>
              <div className="mt-2">
                <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full"
                    style={{ width: `${totalValue > 0 ? (riskTiers[RISK_TIERS.RISKY].value / totalValue * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {totalValue > 0 ? ((riskTiers[RISK_TIERS.RISKY].value / totalValue) * 100).toFixed(1) : 0}% of portfolio
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;
