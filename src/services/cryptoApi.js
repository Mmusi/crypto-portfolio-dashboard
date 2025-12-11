import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// CoinGecko ID mapping for our portfolio assets
const COIN_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  LINK: 'chainlink',
  SOL: 'solana',
  SUI: 'sui',
  AVAX: 'avalanche-2',
  XRP: 'ripple',
  DOT: 'polkadot',
  FET: 'fetch-ai',
  RNDR: 'render-token',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  USDT: 'tether',
  USDC: 'usd-coin'
};

class CryptoApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // Get current prices for multiple coins
  async getPrices(symbols) {
    const cacheKey = `prices_${symbols.join('_')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const coinIds = symbols.map(s => COIN_ID_MAP[s]).filter(Boolean).join(',');
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: coinIds,
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        }
      });

      const prices = {};
      symbols.forEach(symbol => {
        const coinId = COIN_ID_MAP[symbol];
        if (coinId && response.data[coinId]) {
          prices[symbol] = {
            price: response.data[coinId].usd,
            change24h: response.data[coinId].usd_24h_change || 0,
            volume24h: response.data[coinId].usd_24h_vol || 0,
            marketCap: response.data[coinId].usd_market_cap || 0
          };
        }
      });

      this.setCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return {};
    }
  }

  // Get historical data for charts
  async getHistoricalData(symbol, days = 30) {
    const cacheKey = `history_${symbol}_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const coinId = COIN_ID_MAP[symbol];
      if (!coinId) return [];

      const response = await axios.get(`${COINGECKO_API}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days
        }
      });

      const data = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp),
        price
      }));

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  // Get market data including TPS, staking yields (mock data for some)
  async getMarketData(symbol) {
    try {
      const coinId = COIN_ID_MAP[symbol];
      if (!coinId) return null;

      const response = await axios.get(`${COINGECKO_API}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: true,
          developer_data: false
        }
      });

      return {
        symbol,
        name: response.data.name,
        marketCap: response.data.market_data.market_cap.usd,
        totalVolume: response.data.market_data.total_volume.usd,
        circulatingSupply: response.data.market_data.circulating_supply,
        totalSupply: response.data.market_data.total_supply,
        ath: response.data.market_data.ath.usd,
        athDate: response.data.market_data.ath_date.usd,
        sentiment: response.data.sentiment_votes_up_percentage || 50
      };
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      return null;
    }
  }

  // Get trending coins and sentiment (for meme dashboard)
  async getTrendingCoins() {
    try {
      const response = await axios.get(`${COINGECKO_API}/search/trending`);
      return response.data.coins.map(coin => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol,
        marketCapRank: coin.item.market_cap_rank,
        score: coin.item.score
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  }

  // Cache helpers
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new CryptoApiService();
