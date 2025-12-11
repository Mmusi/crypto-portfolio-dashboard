// Conversion service for token to USDT conversion
import axios from 'axios';

class ConversionService {
  constructor() {
    this.priceCache = {};
    this.cacheExpiry = 60000; // 1 minute cache
    this.lastUpdate = {};
  }

  // Get token price from CoinGecko
  async getTokenPrice(tokenSymbol) {
    const symbol = tokenSymbol.toUpperCase();
    
    // Return 1 for stablecoins
    if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(symbol)) {
      return 1;
    }

    // Check cache
    const now = Date.now();
    if (this.priceCache[symbol] && (now - this.lastUpdate[symbol] < this.cacheExpiry)) {
      return this.priceCache[symbol];
    }

    try {
      // Map common symbols to CoinGecko IDs
      const coinIds = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'AVAX': 'avalanche-2',
        'DOT': 'polkadot',
        'MATIC': 'matic-network',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'ATOM': 'cosmos',
        'LTC': 'litecoin',
        'ETC': 'ethereum-classic',
        'XLM': 'stellar',
        'ALGO': 'algorand',
        'VET': 'vechain',
        'ICP': 'internet-computer',
        'FIL': 'filecoin',
        'TRX': 'tron',
        'NEAR': 'near',
        'APT': 'aptos',
        'SUI': 'sui',
        'ARB': 'arbitrum',
        'OP': 'optimism',
        'DOGE': 'dogecoin',
        'SHIB': 'shiba-inu',
        'PEPE': 'pepe',
        'BONK': 'bonk',
        'WIF': 'dogwifcoin',
        'FET': 'fetch-ai',
        'RNDR': 'render-token',
        'TAO': 'bittensor',
        'INJ': 'injective-protocol'
      };

      const coinId = coinIds[symbol] || symbol.toLowerCase();
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
        { timeout: 5000 }
      );

      const price = response.data[coinId]?.usd || 0;
      
      // Update cache
      this.priceCache[symbol] = price;
      this.lastUpdate[symbol] = now;
      
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error.message);
      // Return cached price if available, otherwise 0
      return this.priceCache[symbol] || 0;
    }
  }

  // Convert token amount to USDT
  async convertToUSDT(tokenSymbol, amount) {
    if (!amount || amount === 0) return 0;
    
    const price = await this.getTokenPrice(tokenSymbol);
    return amount * price;
  }

  // Batch convert multiple tokens
  async batchConvert(conversions) {
    const results = {};
    
    for (const { token, amount } of conversions) {
      results[token] = await this.convertToUSDT(token, amount);
    }
    
    return results;
  }

  // Get multiple token prices at once
  async getBatchPrices(tokenSymbols) {
    const prices = {};
    
    for (const symbol of tokenSymbols) {
      prices[symbol] = await this.getTokenPrice(symbol);
    }
    
    return prices;
  }

  // Clear cache
  clearCache() {
    this.priceCache = {};
    this.lastUpdate = {};
  }

  // Get cache status
  getCacheStatus() {
    const now = Date.now();
    const status = {};
    
    for (const [symbol, lastUpdate] of Object.entries(this.lastUpdate)) {
      const age = now - lastUpdate;
      status[symbol] = {
        price: this.priceCache[symbol],
        age: age,
        expired: age > this.cacheExpiry
      };
    }
    
    return status;
  }
}

// Create singleton instance
const conversionService = new ConversionService();

export default conversionService;
