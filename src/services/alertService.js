import { ALERT_TYPES, ALERT_SEVERITY, PORTFOLIO_CONFIG } from '../types/portfolio';
import { calculateAllocations, calculateAllocationDeviation, calculateSharpeRatio, calculateVolatility } from '../utils/portfolioCalculations';

class AlertService {
  constructor() {
    this.alerts = [];
    this.alertConfig = {
      priceMovement: {
        threshold5: 0.05,
        threshold10: 0.10,
        threshold30: 0.30
      },
      portfolioValue: {
        thresholdUp: 0.20,
        thresholdDown: -0.10
      },
      allocationDeviation: {
        threshold: 0.05
      },
      sharpeRatio: {
        threshold: 1.0
      },
      volatility: {
        threshold: 50
      }
    };
    this.lastChecked = {};
  }

  // Check for price movement alerts
  checkPriceMovements(prices, historicalPrices) {
    const alerts = [];
    
    Object.entries(prices).forEach(([symbol, data]) => {
      const change = data.change24h / 100;
      const config = PORTFOLIO_CONFIG.assets[symbol];
      
      if (!config) return;
      
      // BTC/ETH 10% movement
      if ((symbol === 'BTC' || symbol === 'ETH') && Math.abs(change) >= this.alertConfig.priceMovement.threshold10) {
        alerts.push({
          id: `price_${symbol}_${Date.now()}`,
          type: ALERT_TYPES.PRICE_MOVEMENT,
          severity: ALERT_SEVERITY.HIGH,
          symbol,
          message: `${config.name} moved ${(change * 100).toFixed(2)}% in 24h`,
          timestamp: new Date(),
          data: { change, price: data.price }
        });
      }
      
      // Mid-cap 30% gain
      if (config.category === 'mid_low_cap' && change >= this.alertConfig.priceMovement.threshold30) {
        alerts.push({
          id: `price_${symbol}_${Date.now()}`,
          type: ALERT_TYPES.PRICE_MOVEMENT,
          severity: ALERT_SEVERITY.CRITICAL,
          symbol,
          message: `${config.name} gained ${(change * 100).toFixed(2)}% - Consider 5% cashout`,
          timestamp: new Date(),
          data: { change, price: data.price },
          action: 'CASHOUT_5_PERCENT'
        });
      }
      
      // Any asset 10% movement
      if (Math.abs(change) >= this.alertConfig.priceMovement.threshold10) {
        alerts.push({
          id: `price_${symbol}_${Date.now()}`,
          type: ALERT_TYPES.PRICE_MOVEMENT,
          severity: change > 0 ? ALERT_SEVERITY.MEDIUM : ALERT_SEVERITY.HIGH,
          symbol,
          message: `${config.name} ${change > 0 ? 'up' : 'down'} ${Math.abs(change * 100).toFixed(2)}%`,
          timestamp: new Date(),
          data: { change, price: data.price }
        });
      }
    });
    
    return alerts;
  }

  // Check for allocation deviation alerts
  checkAllocationDeviations(holdings, prices) {
    const alerts = [];
    const { allocations } = calculateAllocations(holdings, prices);
    
    Object.entries(allocations).forEach(([symbol, currentAllocation]) => {
      const config = PORTFOLIO_CONFIG.assets[symbol];
      if (!config) return;
      
      const targetAllocation = config.targetAllocation;
      const deviation = calculateAllocationDeviation(currentAllocation, targetAllocation);
      
      if (deviation > this.alertConfig.allocationDeviation.threshold) {
        alerts.push({
          id: `allocation_${symbol}_${Date.now()}`,
          type: ALERT_TYPES.ALLOCATION_DEVIATION,
          severity: deviation > 0.10 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
          symbol,
          message: `${config.name} allocation is ${(currentAllocation * 100).toFixed(2)}% (target: ${(targetAllocation * 100).toFixed(2)}%)`,
          timestamp: new Date(),
          data: { 
            currentAllocation, 
            targetAllocation, 
            deviation 
          },
          action: 'REBALANCE'
        });
      }
    });
    
    return alerts;
  }

  // Check portfolio value changes
  checkPortfolioValue(currentValue, previousValue) {
    const alerts = [];
    
    if (previousValue === 0) return alerts;
    
    const change = (currentValue - previousValue) / previousValue;
    
    if (change <= this.alertConfig.portfolioValue.thresholdDown) {
      alerts.push({
        id: `portfolio_value_${Date.now()}`,
        type: ALERT_TYPES.PORTFOLIO_VALUE,
        severity: ALERT_SEVERITY.CRITICAL,
        message: `Portfolio value down ${(Math.abs(change) * 100).toFixed(2)}%`,
        timestamp: new Date(),
        data: { currentValue, previousValue, change }
      });
    } else if (change >= this.alertConfig.portfolioValue.thresholdUp) {
      alerts.push({
        id: `portfolio_value_${Date.now()}`,
        type: ALERT_TYPES.PORTFOLIO_VALUE,
        severity: ALERT_SEVERITY.MEDIUM,
        message: `Portfolio value up ${(change * 100).toFixed(2)}%`,
        timestamp: new Date(),
        data: { currentValue, previousValue, change }
      });
    }
    
    return alerts;
  }

  // Check Sharpe Ratio
  checkSharpeRatio(returns) {
    const alerts = [];
    const sharpeRatio = calculateSharpeRatio(returns);
    
    if (sharpeRatio < this.alertConfig.sharpeRatio.threshold) {
      alerts.push({
        id: `sharpe_${Date.now()}`,
        type: ALERT_TYPES.SHARPE_RATIO,
        severity: ALERT_SEVERITY.HIGH,
        message: `Sharpe Ratio below threshold: ${sharpeRatio.toFixed(2)}`,
        timestamp: new Date(),
        data: { sharpeRatio },
        action: 'CASHOUT_5_PERCENT_TO_STABLE'
      });
    }
    
    return alerts;
  }

  // Check volatility
  checkVolatility(prices) {
    const alerts = [];
    
    Object.entries(prices).forEach(([symbol, priceData]) => {
      const config = PORTFOLIO_CONFIG.assets[symbol];
      if (!config || config.type === 'stable') return;
      
      // This would need historical price array, simplified here
      const volatility = Math.abs(priceData.change24h);
      
      if (volatility > this.alertConfig.volatility.threshold) {
        alerts.push({
          id: `volatility_${symbol}_${Date.now()}`,
          type: ALERT_TYPES.VOLATILITY,
          severity: ALERT_SEVERITY.HIGH,
          symbol,
          message: `${config.name} experiencing high volatility: ${volatility.toFixed(2)}%`,
          timestamp: new Date(),
          data: { volatility }
        });
      }
    });
    
    return alerts;
  }

  // Get all active alerts
  getActiveAlerts() {
    const now = Date.now();
    // Keep alerts for 24 hours
    this.alerts = this.alerts.filter(alert => 
      now - alert.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    return this.alerts;
  }

  // Add alert
  addAlert(alert) {
    // Prevent duplicate alerts within 1 hour
    const isDuplicate = this.alerts.some(existing => 
      existing.symbol === alert.symbol &&
      existing.type === alert.type &&
      Date.now() - existing.timestamp.getTime() < 60 * 60 * 1000
    );
    
    if (!isDuplicate) {
      this.alerts.push(alert);
    }
  }

  // Dismiss alert
  dismissAlert(alertId) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  // Clear all alerts
  clearAlerts() {
    this.alerts = [];
  }

  // Run all checks
  runAllChecks(holdings, prices, historicalData, portfolioHistory) {
    const allAlerts = [
      ...this.checkPriceMovements(prices, historicalData),
      ...this.checkAllocationDeviations(holdings, prices)
    ];
    
    if (portfolioHistory.length >= 2) {
      const currentValue = portfolioHistory[portfolioHistory.length - 1].value;
      const previousValue = portfolioHistory[portfolioHistory.length - 2].value;
      allAlerts.push(...this.checkPortfolioValue(currentValue, previousValue));
    }
    
    allAlerts.forEach(alert => this.addAlert(alert));
    
    return this.getActiveAlerts();
  }
}

export default new AlertService();
