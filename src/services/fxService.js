class FxService {
  constructor() {
    this.rates = {}; // { 'USD_BWP': { rate: 13.5, lastUpdated: Date } }
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }

  _key(base, target) {
    return `${base}_${target}`;
  }

  async fetchRate(base = 'USD', target = 'BWP') {
    const key = this._key(base, target);
    try {
      // Use exchangerate.host free API
      const resp = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=${target}`);
      if (!resp.ok) throw new Error(`FX fetch failed: ${resp.status}`);
      const data = await resp.json();
      if (data && data.rates && data.rates[target]) {
        this.rates[key] = { rate: Number(data.rates[target]), lastUpdated: new Date() };
        return this.rates[key];
      }
    } catch (err) {
      console.warn('FxService.fetchRate error', err);
    }
    return null;
  }

  async init(base = 'USD', target = 'BWP') {
    const key = this._key(base, target);
    const existing = this.rates[key];
    if (existing && (new Date() - existing.lastUpdated) < this.cacheTTL) return existing;
    return this.fetchRate(base, target);
  }

  getLatestRate(base = 'USD', target = 'BWP') {
    const key = this._key(base, target);
    const rec = this.rates[key];
    return rec || { rate: 1, lastUpdated: null };
  }

  // Synchronous convert using cached rate (fallback to 1 if missing)
  convertSync(amount, base = 'USD', target = 'BWP') {
    const r = this.getLatestRate(base, target).rate || 1;
    return amount * r;
  }
}

const fxService = new FxService();
export default fxService;
