// IndexedDB service for Capital Building features
const DB_NAME = 'CapitalBuildingDB';
const DB_VERSION = 2;

class CapitalBuildingDB {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Earnings store
        if (!db.objectStoreNames.contains('earnings')) {
          const earningsStore = db.createObjectStore('earnings', { keyPath: 'id', autoIncrement: true });
          earningsStore.createIndex('date', 'date', { unique: false });
          earningsStore.createIndex('platformName', 'platformName', { unique: false });
          earningsStore.createIndex('category', 'category', { unique: false });
        }

        // Trades store
        if (!db.objectStoreNames.contains('trades')) {
          const tradesStore = db.createObjectStore('trades', { keyPath: 'id', autoIncrement: true });
          tradesStore.createIndex('date', 'date', { unique: false });
          tradesStore.createIndex('exchange', 'exchange', { unique: false });
          tradesStore.createIndex('tradeType', 'tradeType', { unique: false });
        }

        // Miners store
        if (!db.objectStoreNames.contains('miners')) {
          const minersStore = db.createObjectStore('miners', { keyPath: 'id', autoIncrement: true });
          minersStore.createIndex('minerName', 'minerName', { unique: false });
          minersStore.createIndex('status', 'status', { unique: false });
        }

        // Projections store
        if (!db.objectStoreNames.contains('projections')) {
          const projectionsStore = db.createObjectStore('projections', { keyPath: 'id', autoIncrement: true });
          projectionsStore.createIndex('date', 'date', { unique: false });
        }

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          tasksStore.createIndex('platformName', 'platformName', { unique: false });
          tasksStore.createIndex('frequency', 'frequency', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Activities store (new in v2)
        if (!db.objectStoreNames.contains('activities')) {
          const activitiesStore = db.createObjectStore('activities', { keyPath: 'id', autoIncrement: true });
          activitiesStore.createIndex('date', 'date', { unique: false });
          activitiesStore.createIndex('platformName', 'platformName', { unique: false });
          activitiesStore.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  // Generic CRUD operations
  async add(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Earnings operations
  async addEarning(earning) {
    const record = {
      ...earning,
      date: earning.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    // Ensure we don't pass an invalid key value for 'id' (IndexedDB key must be a string or number)
    if (record.hasOwnProperty('id')) {
      const idType = typeof record.id;
      if (!(idType === 'number' || idType === 'string')) {
        // remove invalid id so autoIncrement can assign one
        delete record.id;
      }
    }

    console.debug('capitalBuildingDB.addEarning -> adding record:', record);
    return this.add('earnings', record);
  }

  async getEarningsByDate(date) {
    return this.getByIndex('earnings', 'date', date);
  }

  async getEarningsByPlatform(platformName) {
    return this.getByIndex('earnings', 'platformName', platformName);
  }

  async getEarningsByDateRange(startDate, endDate) {
    const allEarnings = await this.getAll('earnings');
    return allEarnings.filter(e => e.date >= startDate && e.date <= endDate);
  }

  // Trades operations
  async addTrade(trade) {
    const pnl = (trade.exitPrice - trade.entryPrice) * trade.size;
    const record = {
      ...trade,
      PNL_USDT: pnl,
      date: trade.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    if (record.hasOwnProperty('id')) {
      const idType = typeof record.id;
      if (!(idType === 'number' || idType === 'string')) {
        delete record.id;
      }
    }

    console.debug('capitalBuildingDB.addTrade -> adding record:', record);
    return this.add('trades', record);
  }

  async getTradesByExchange(exchange) {
    return this.getByIndex('trades', 'exchange', exchange);
  }

  async getTradesByDateRange(startDate, endDate) {
    const allTrades = await this.getAll('trades');
    return allTrades.filter(t => t.date >= startDate && t.date <= endDate);
  }

  // Miners operations
  async addMiner(miner) {
    return this.add('miners', {
      ...miner,
      timestamp: new Date().toISOString()
    });
  }

  async getActiveMiner() {
    const allMiners = await this.getAll('miners');
    return allMiners.filter(m => m.status === 'active');
  }

  // Tasks operations
  async addTask(task) {
    return this.add('tasks', {
      ...task,
      status: task.status || 'Not Done',
      createdAt: new Date().toISOString()
    });
  }

  async updateTaskStatus(id, status) {
    const task = await this.get('tasks', id);
    if (task) {
      task.status = status;
      task.lastUpdated = new Date().toISOString();
      return this.update('tasks', task);
    }
  }

  async resetDailyTasks() {
    const allTasks = await this.getAll('tasks');
    const dailyTasks = allTasks.filter(t => t.frequency === 'Daily');
    
    for (const task of dailyTasks) {
      task.status = 'Not Done';
      task.lastReset = new Date().toISOString();
      await this.update('tasks', task);
    }
  }

  // Projections operations
  async addProjection(projection) {
    return this.add('projections', {
      ...projection,
      date: projection.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  }

  async getLatestProjection() {
    const allProjections = await this.getAll('projections');
    return allProjections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }

  // Settings operations
  async saveSetting(key, value) {
    return this.update('settings', { id: key, value });
  }

  async getSetting(key) {
    const setting = await this.get('settings', key);
    return setting ? setting.value : null;
  }

  // Analytics operations
  async addActivity(activity) {
    const record = {
      ...activity,
      date: activity.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    if (record.hasOwnProperty('id')) {
      const idType = typeof record.id;
      if (!(idType === 'number' || idType === 'string')) delete record.id;
    }

      console.debug('capitalBuildingDB.addActivity -> adding record:', record);
    return this.add('activities', record);
  }

  async getActivitiesByDate(date) {
    return this.getByIndex('activities', 'date', date);
  }

  async getActivitiesByDateRange(startDate, endDate) {
    const allActivities = await this.getAll('activities');
    return allActivities.filter(a => a.date >= startDate && a.date <= endDate);
  }

  async getTotalEarningsToday() {
    const today = new Date().toISOString().split('T')[0];
    const earnings = await this.getEarningsByDate(today);
    return earnings.reduce((sum, e) => sum + (e.amountUSDT || 0), 0);
  }

  async getEarningsLast7Days() {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const earnings = await this.getEarningsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    return earnings.reduce((sum, e) => sum + (e.amountUSDT || 0), 0);
  }

  async getTradePerformance(exchange = null) {
    const trades = exchange 
      ? await this.getTradesByExchange(exchange)
      : await this.getAll('trades');
    
    const totalPNL = trades.reduce((sum, t) => sum + (t.PNL_USDT || 0), 0);
    const wins = trades.filter(t => (t.PNL_USDT || 0) > 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const avgPNL = trades.length > 0 ? totalPNL / trades.length : 0;
    
    return { totalPNL, wins, winRate, avgPNL, totalTrades: trades.length };
  }

  async getMiningStats() {
    const miners = await this.getActiveMiner();
    const totalDaily = miners.reduce((sum, m) => sum + (m.dailyMiningUSDT || 0), 0);
    const weeklyProjection = totalDaily * 7;
    const monthlyProjection = totalDaily * 30;
    
    return { totalDaily, weeklyProjection, monthlyProjection, activeMiners: miners.length };
  }

  async calculateProjections() {
    const earningsLast7 = await this.getEarningsLast7Days();
    const miningStats = await this.getMiningStats();
    const tradePerf = await this.getTradePerformance();
    
    const dailyAvg = (earningsLast7 / 7) + miningStats.totalDaily + (tradePerf.avgPNL > 0 ? tradePerf.avgPNL : 0);
    const weekProjection = dailyAvg * 7;
    const monthProjection = dailyAvg * 30;
    
    const targets = [3000, 10000, 50000];
    const daysToTarget = targets.map(target => ({
      target,
      days: dailyAvg > 0 ? Math.ceil(target / dailyAvg) : Infinity
    }));
    
    return {
      dailyAvg,
      weekProjection,
      monthProjection,
      daysToTarget
    };
  }
}

// Create singleton instance
const capitalBuildingDB = new CapitalBuildingDB();

export default capitalBuildingDB;
