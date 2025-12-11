// Portfolio Types and Constants

export const RISK_TIERS = {
  SAFEST: 'safest',
  MODERATE: 'moderate',
  RISKY: 'risky'
};

export const ASSET_CATEGORIES = {
  BTC_ETH: 'btc_eth',
  MID_LOW_CAP: 'mid_low_cap',
  MEMECOINS: 'memecoins',
  STABLECOINS: 'stablecoins'
};

export const ASSET_TYPES = {
  LAYER1: 'layer1',
  AI: 'ai',
  USABILITY: 'usability',
  MEME: 'meme',
  STABLE: 'stable'
};

// Portfolio Asset Configuration
export const PORTFOLIO_CONFIG = {
  assets: {
    // Bitcoin & Ethereum (10% combined)
    BTC: {
      symbol: 'BTC',
      name: 'Bitcoin',
      category: ASSET_CATEGORIES.BTC_ETH,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.05,
      risk: RISK_TIERS.SAFEST
    },
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      category: ASSET_CATEGORIES.BTC_ETH,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.05,
      risk: RISK_TIERS.SAFEST
    },
    
    // Mid-to-Low Cap Altcoins (50%)
    LINK: {
      symbol: 'LINK',
      name: 'Chainlink',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.USABILITY,
      targetAllocation: 0.08,
      risk: RISK_TIERS.SAFEST
    },
    SOL: {
      symbol: 'SOL',
      name: 'Solana',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.10,
      risk: RISK_TIERS.SAFEST
    },
    SUI: {
      symbol: 'SUI',
      name: 'Sui',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.08,
      risk: RISK_TIERS.SAFEST
    },
    AVAX: {
      symbol: 'AVAX',
      name: 'Avalanche',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.06,
      risk: RISK_TIERS.MODERATE
    },
    XRP: {
      symbol: 'XRP',
      name: 'Ripple',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.USABILITY,
      targetAllocation: 0.04,
      risk: RISK_TIERS.MODERATE
    },
    DOT: {
      symbol: 'DOT',
      name: 'Polkadot',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.LAYER1,
      targetAllocation: 0.04,
      risk: RISK_TIERS.MODERATE
    },
    FET: {
      symbol: 'FET',
      name: 'Fetch.ai',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.AI,
      targetAllocation: 0.05,
      risk: RISK_TIERS.MODERATE
    },
    RNDR: {
      symbol: 'RNDR',
      name: 'Render',
      category: ASSET_CATEGORIES.MID_LOW_CAP,
      type: ASSET_TYPES.AI,
      targetAllocation: 0.05,
      risk: RISK_TIERS.MODERATE
    },
    
    // Memecoins (10%)
    DOGE: {
      symbol: 'DOGE',
      name: 'Dogecoin',
      category: ASSET_CATEGORIES.MEMECOINS,
      type: ASSET_TYPES.MEME,
      targetAllocation: 0.03,
      risk: RISK_TIERS.RISKY
    },
    SHIB: {
      symbol: 'SHIB',
      name: 'Shiba Inu',
      category: ASSET_CATEGORIES.MEMECOINS,
      type: ASSET_TYPES.MEME,
      targetAllocation: 0.02,
      risk: RISK_TIERS.RISKY
    },
    PEPE: {
      symbol: 'PEPE',
      name: 'Pepe',
      category: ASSET_CATEGORIES.MEMECOINS,
      type: ASSET_TYPES.MEME,
      targetAllocation: 0.02,
      risk: RISK_TIERS.RISKY
    },
    MONK: {
      symbol: 'MONK',
      name: 'MonkeyPox',
      category: ASSET_CATEGORIES.MEMECOINS,
      type: ASSET_TYPES.MEME,
      targetAllocation: 0.015,
      risk: RISK_TIERS.RISKY
    },
    MUMU: {
      symbol: 'MUMU',
      name: 'Mumu',
      category: ASSET_CATEGORIES.MEMECOINS,
      type: ASSET_TYPES.MEME,
      targetAllocation: 0.015,
      risk: RISK_TIERS.RISKY
    },
    
    // Stablecoins (30%)
    USDT: {
      symbol: 'USDT',
      name: 'Tether',
      category: ASSET_CATEGORIES.STABLECOINS,
      type: ASSET_TYPES.STABLE,
      targetAllocation: 0.15,
      risk: RISK_TIERS.SAFEST
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      category: ASSET_CATEGORIES.STABLECOINS,
      type: ASSET_TYPES.STABLE,
      targetAllocation: 0.15,
      risk: RISK_TIERS.SAFEST
    }
  }
};

// Alert Configuration
export const ALERT_TYPES = {
  PRICE_MOVEMENT: 'price_movement',
  PORTFOLIO_VALUE: 'portfolio_value',
  ALLOCATION_DEVIATION: 'allocation_deviation',
  SHARPE_RATIO: 'sharpe_ratio',
  VOLATILITY: 'volatility',
  NEWS: 'news'
};

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};
