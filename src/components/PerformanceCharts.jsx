import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/portfolioCalculations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PerformanceCharts = ({ portfolioHistory = [] }) => {
  const [timeframe, setTimeframe] = useState('30d');

  // Filter data based on timeframe
  const getFilteredData = () => {
    const now = new Date();
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = daysMap[timeframe] || 30;
    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return portfolioHistory.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  const chartData = {
    labels: filteredData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Portfolio Value',
        data: filteredData.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#3b82f6',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `Value: ${formatCurrency(context.raw)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          maxRotation: 0,
          autoSkipPadding: 20
        }
      },
      y: {
        grid: {
          color: '#334155',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          callback: (value) => {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (filteredData.length < 2) {
      return { change: 0, changePercent: 0, high: 0, low: 0 };
    }

    const start = filteredData[0].value;
    const end = filteredData[filteredData.length - 1].value;
    const change = end - start;
    const changePercent = start > 0 ? (change / start) * 100 : 0;
    
    const values = filteredData.map(item => item.value);
    const high = Math.max(...values);
    const low = Math.min(...values);

    return { change, changePercent, high, low };
  };

  const metrics = calculateMetrics();

  return (
    <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-crypto-blue mr-2" />
          <h3 className="text-xl font-semibold text-white">Performance Over Time</h3>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          {['7d', '30d', '90d', '1y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-crypto-blue text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Period Change</p>
          <p className={`text-lg font-bold ${metrics.change >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
            {metrics.change >= 0 ? '+' : ''}{formatCurrency(metrics.change)}
          </p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Change %</p>
          <p className={`text-lg font-bold ${metrics.changePercent >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
            {metrics.changePercent >= 0 ? '+' : ''}{metrics.changePercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Period High</p>
          <p className="text-lg font-bold text-white">{formatCurrency(metrics.high)}</p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Period Low</p>
          <p className="text-lg font-bold text-white">{formatCurrency(metrics.low)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {filteredData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No performance data available
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceCharts;
