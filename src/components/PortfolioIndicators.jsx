import React from 'react';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { calculateSharpeRatio, calculateVolatility } from '../utils/portfolioCalculations';

const PortfolioIndicators = ({ portfolioHistory = [], returns = [] }) => {
  const sharpeRatio = calculateSharpeRatio(returns);
  
  // Calculate volatility from recent price history
  const recentPrices = portfolioHistory.slice(-30).map(h => h.value);
  const volatility = calculateVolatility(recentPrices);

  const indicators = [
    {
      icon: TrendingUp,
      label: 'Sharpe Ratio',
      value: sharpeRatio.toFixed(2),
      description: 'Risk-adjusted returns',
      color: sharpeRatio >= 1.0 ? 'text-crypto-green' : 'text-crypto-red',
      bgColor: sharpeRatio >= 1.0 ? 'bg-green-900/20' : 'bg-red-900/20',
      borderColor: sharpeRatio >= 1.0 ? 'border-green-600' : 'border-red-600'
    },
    {
      icon: Activity,
      label: '30-Day Volatility',
      value: `${volatility.toFixed(1)}%`,
      description: 'Portfolio price fluctuation',
      color: volatility < 30 ? 'text-crypto-green' : volatility < 50 ? 'text-yellow-400' : 'text-crypto-red',
      bgColor: volatility < 30 ? 'bg-green-900/20' : volatility < 50 ? 'bg-yellow-900/20' : 'bg-red-900/20',
      borderColor: volatility < 30 ? 'border-green-600' : volatility < 50 ? 'border-yellow-600' : 'border-red-600'
    },
    {
      icon: BarChart3,
      label: 'Performance Score',
      value: returns.length > 0 ? (returns.slice(-7).reduce((a, b) => a + b, 0) / 7 * 100).toFixed(1) + '%' : 'N/A',
      description: '7-day average return',
      color: 'text-crypto-blue',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-600'
    }
  ];

  return (
    <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Portfolio Indicators</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <div
              key={indicator.label}
              className={`border ${indicator.borderColor} ${indicator.bgColor} p-4 rounded-lg`}
            >
              <div className="flex items-center mb-2">
                <Icon className={`w-5 h-5 ${indicator.color} mr-2`} />
                <span className="text-gray-300 text-sm">{indicator.label}</span>
              </div>
              <p className={`text-3xl font-bold ${indicator.color}`}>{indicator.value}</p>
              <p className="text-gray-400 text-xs mt-1">{indicator.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioIndicators;
