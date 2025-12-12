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
      // Try exchangerate.host first
      const endpoints = [
        `https://api.exchangerate.host/latest?base=${base}&symbols=${target}`,
        // fallback endpoints
        `https://open.er-api.com/v6/latest/${base}`,
        `https://api.exchangerate-api.com/v4/latest/${base}`
      ];

      for (const url of endpoints) {
        try {
          const resp = await fetch(url);
          if (!resp.ok) { console.warn('FxService.fetchRate: non-ok response', url, resp.status); continue; }
          const data = await resp.json();
          // Normalized formats: exchangerate.host -> { rates: { BWP: rate } }
          // open.er-api and exchangerate-api -> { rates: { BWP: rate } }
          const rateVal = (data && data.rates && (data.rates[target] || data.rates[target.toUpperCase()])) || null;
          if (rateVal) {
            this.rates[key] = { rate: Number(rateVal), lastUpdated: new Date(), source: url };
            return this.rates[key];
          }
        } catch (err) {
          console.warn('FxService.fetchRate attempt failed', url, err);
          continue;
        }
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
    return rec || { rate: null, lastUpdated: null };
  }

  // Synchronous convert using cached rate (fallback to 1 if missing)
  convertSync(amount, base = 'USD', target = 'BWP') {
    const r = this.getLatestRate(base, target).rate;
    if (!r) return NaN;
    return amount * r;
  }
}

const fxService = new FxService();
export default fxService;
