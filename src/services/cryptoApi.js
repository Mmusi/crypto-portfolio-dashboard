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
      // Resolve any missing coin ids
      const symbolToId = {};
      for (const s of symbols) {
        const uc = s.toUpperCase();
        let id = COIN_ID_MAP[uc];
        if (!id) {
          try {
            id = await this.resolveCoinId(uc);
          } catch (err) {
            // ignore
          }
        }
        if (id) symbolToId[uc] = id;
      }
      const coinIds = Object.values(symbolToId).join(',');
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
        const uc = symbol.toUpperCase();
        const coinId = symbolToId[uc] || COIN_ID_MAP[uc];
        if (coinId && response.data[coinId]) {
          prices[uc] = {
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

  // Resolve a coin symbol to a CoinGecko coin id (cache in COIN_ID_MAP)
  async resolveCoinId(symbol) {
    const s = (symbol || '').toUpperCase();
    if (!s) return null;
    if (COIN_ID_MAP[s]) return COIN_ID_MAP[s];

    try {
      let resp = await axios.get(`${COINGECKO_API}/search`, { params: { query: s } });
      const coins = resp.data.coins || [];
      // If not found and symbol ends with S (plural), try singular form
      if ((!coins || coins.length === 0) && s.endsWith('S')) {
        const singular = s.slice(0, -1);
        resp = await axios.get(`${COINGECKO_API}/search`, { params: { query: singular } });
      }
      const coins2 = resp.data.coins || [];
      const coinsList = coins2.length ? coins2 : coins;
      // Try to find a coin whose symbol matches exactly (case-insensitive)
      let found = coinsList.find(c => (c.symbol || '').toUpperCase() === s);
      if (!found && coinsList.length === 0) {
        // Fallback: fetch entire coin list and try to match symbol
        const listResp = await axios.get(`${COINGECKO_API}/coins/list`);
        const list = listResp.data || [];
        found = list.find(c => (c.symbol || '').toUpperCase() === s || (c.id || '').toLowerCase() === s.toLowerCase());
      }
      if (!found) {
        // Try loose matches by id or name
        found = coins.find(c => (c.id || '').toLowerCase().includes(s.toLowerCase()) || (c.name || '').toLowerCase().includes(s.toLowerCase()));
      }
      if (found && found.id) {
        COIN_ID_MAP[s] = found.id; // cache mapping
        console.debug(`cryptoApi.resolveCoinId: resolved ${s} -> ${found.id}`);
        return found.id;
      }
    } catch (err) {
      console.warn('Error resolving coin id for', symbol, err.message || err);
    }

    return null;
  }

  // Get historical price for a symbol on a specific date (YYYY-MM-DD)
  async getPriceOnDate(symbol, dateStr) {
    if (!symbol || !dateStr) return null;
    const cacheKey = `history_price_${symbol}_${dateStr}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const coinId = await this.resolveCoinId(symbol);
      if (!coinId) return null;
      // CoinGecko expects date as DD-MM-YYYY
      const [y,m,d] = dateStr.split('-').map(Number);
      const dateParam = `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
      const resp = await axios.get(`${COINGECKO_API}/coins/${coinId}/history`, { params: { date: dateParam } });
      const price = resp.data?.market_data?.current_price?.usd || null;
      if (price !== null) this.setCache(cacheKey, price);
      return price;
    } catch (err) {
      console.warn(`Error fetching historical price for ${symbol} on ${dateStr}:`, err.message || err);
      return null;
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
