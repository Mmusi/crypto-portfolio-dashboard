// Portfolio calculation utilities

// Calculate Sharpe Ratio (risk-adjusted returns)
export const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  return (avgReturn - riskFreeRate) / stdDev;
};

// Calculate 30-day rolling volatility
export const calculateVolatility = (prices) => {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(dailyReturn);
  }
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  
  // Annualized volatility
  return Math.sqrt(variance * 365) * 100;
};

// Calculate correlation between two assets
export const calculateCorrelation = (prices1, prices2) => {
  if (prices1.length !== prices2.length || prices1.length < 2) return 0;
  
  const n = prices1.length;
  const returns1 = [];
  const returns2 = [];
  
  for (let i = 1; i < n; i++) {
    returns1.push((prices1[i] - prices1[i - 1]) / prices1[i - 1]);
    returns2.push((prices2[i] - prices2[i - 1]) / prices2[i - 1]);
  }
  
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
};

// Calculate portfolio allocation percentages
export const calculateAllocations = (holdings, prices) => {
  const totalValue = Object.entries(holdings).reduce((sum, [symbol, amount]) => {
    const price = prices[symbol]?.price || 0;
    return sum + (amount * price);
  }, 0);
  
  const allocations = {};
  Object.entries(holdings).forEach(([symbol, amount]) => {
    const price = prices[symbol]?.price || 0;
    const value = amount * price;
    allocations[symbol] = totalValue > 0 ? (value / totalValue) : 0;
  });
  
  return { allocations, totalValue };
};

// Calculate allocation deviation from target
export const calculateAllocationDeviation = (currentAllocation, targetAllocation) => {
  return Math.abs(currentAllocation - targetAllocation);
};

// Calculate portfolio value over time
export const calculatePortfolioValue = (holdings, historicalPrices) => {
  return historicalPrices.map((dayPrices) => {
    const value = Object.entries(holdings).reduce((sum, [symbol, amount]) => {
      const price = dayPrices[symbol] || 0;
      return sum + (amount * price);
    }, 0);
    
    return {
      date: dayPrices.date,
      value
    };
  });
};

// Calculate P&L (Profit and Loss)
export const calculatePnL = (currentValue, initialValue) => {
  const pnl = currentValue - initialValue;
  const pnlPercentage = initialValue > 0 ? (pnl / initialValue) * 100 : 0;
  
  return {
    absolute: pnl,
    percentage: pnlPercentage
  };
};

// Group assets by category
export const groupByCategory = (assets, holdings, prices, portfolioConfig) => {
  const grouped = {};
  
  Object.entries(holdings).forEach(([symbol, amount]) => {
    const config = portfolioConfig.assets[symbol];
    if (!config) return;
    
    const category = config.category;
    const price = prices[symbol]?.price || 0;
    const value = amount * price;
    
    if (!grouped[category]) {
      grouped[category] = {
        totalValue: 0,
        assets: []
      };
    }
    
    grouped[category].totalValue += value;
    grouped[category].assets.push({
      symbol,
      name: config.name,
      amount,
      price,
      value,
      change24h: prices[symbol]?.change24h || 0
    });
  });
  
  return grouped;
};

// Group assets by type (Layer1, AI, etc.)
export const groupByType = (assets, holdings, prices, portfolioConfig) => {
  const grouped = {};
  
  Object.entries(holdings).forEach(([symbol, amount]) => {
    const config = portfolioConfig.assets[symbol];
    if (!config) return;
    
    const type = config.type;
    const price = prices[symbol]?.price || 0;
    const value = amount * price;
    
    if (!grouped[type]) {
      grouped[type] = {
        totalValue: 0,
        assets: []
      };
    }
    
    grouped[type].totalValue += value;
    grouped[type].assets.push({
      symbol,
      name: config.name,
      amount,
      price,
      value,
      change24h: prices[symbol]?.change24h || 0
    });
  });
  
  return grouped;
};

// Format currency
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Format large numbers
export const formatNumber = (value) => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
};
