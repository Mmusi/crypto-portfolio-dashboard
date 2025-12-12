import React, { useState } from 'react';
import { Layers, Cpu, Zap, Smile } from 'lucide-react';
import { formatCurrency, formatNumber, groupByType } from '../utils/portfolioCalculations';
import { PORTFOLIO_CONFIG, ASSET_TYPES } from '../types/portfolio';

const CategoryDashboards = ({ holdings, prices }) => {
  const [activeTab, setActiveTab] = useState('layer1');
  const groupedAssets = groupByType(null, holdings, prices, PORTFOLIO_CONFIG);

  const tabs = [
    { id: 'layer1', label: 'Layer 1', icon: Layers, type: ASSET_TYPES.LAYER1 },
    { id: 'ai', label: 'AI Coins', icon: Cpu, type: ASSET_TYPES.AI },
    { id: 'usability', label: 'Usability', icon: Zap, type: ASSET_TYPES.USABILITY },
    { id: 'meme', label: 'Memes', icon: Smile, type: ASSET_TYPES.MEME }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);
  const assets = groupedAssets[currentTab?.type] || { assets: [], totalValue: 0 };

  return (
    <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Category Dashboards</h3>
      
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-crypto-blue text-crypto-blue'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Category Total Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(assets.totalValue)}</p>
        </div>

        {/* Assets List */}
        <div className="space-y-3">
          {assets.assets.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No assets in this category</p>
          ) : (
            assets.assets.map((asset) => (
              <div key={asset.symbol} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-semibold">{asset.name}</h4>
                    <p className="text-gray-400 text-sm">{asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(asset.value)}</p>
                    <p className={`text-sm font-medium ${asset.change24h >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <p className="text-gray-400">Price</p>
                      <p className="text-white">{asset.price ? formatCurrency(asset.price) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Holdings</p>
                    <p className="text-white">{formatNumber(asset.amount)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDashboards;
