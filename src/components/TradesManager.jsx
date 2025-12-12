import React, { useState, useEffect } from 'react';
import capitalBuildingDB from '../services/capitalBuildingDb';
import { formatCurrency } from '../utils/portfolioCalculations';
import { Save, X } from 'lucide-react';

const EXCHANGES = ['OKX', 'BingX', 'Stormtrade'];
const TRADE_TYPES = ['Spot', 'Futures'];
const DIRECTIONS = ['Long', 'Short'];

const TradesManager = ({ onClose, onSaved }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({ tradeId: '', exchange: EXCHANGES[0], pair: '', tradeType: TRADE_TYPES[0], direction: DIRECTIONS[0], entryPrice: '', exitPrice: '', size: '', notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => { loadTrades(); }, [date]);

  const loadTrades = async () => {
    const all = await capitalBuildingDB.getTradesByDateRange(date, date);
    setTrades(all || []);
  };

  const handleSave = async () => {
    const payload = {
      date,
      tradeId: form.tradeId || undefined,
      exchange: form.exchange,
      pair: form.pair,
      tradeType: form.tradeType,
      direction: form.direction,
      entryPrice: Number(form.entryPrice) || 0,
      exitPrice: Number(form.exitPrice) || 0,
      size: Number(form.size) || 0,
      notes: form.notes
    };

    try {
      await capitalBuildingDB.addTrade(payload);
      if (onSaved) onSaved(payload, { action: 'add' });
      setStatus('Saved');
      setForm({ tradeId: '', exchange: EXCHANGES[0], pair: '', tradeType: TRADE_TYPES[0], direction: DIRECTIONS[0], entryPrice: '', exitPrice: '', size: '', notes: '' });
      await loadTrades();
      setTimeout(() => setStatus(''), 1200);
    } catch (err) {
      console.error('Error saving trade:', err);
      setStatus('Error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await capitalBuildingDB.delete('trades', id);
      if (onSaved) onSaved({ id }, { action: 'delete' });
      setStatus('Deleted');
      await loadTrades();
      setTimeout(() => setStatus(''), 1000);
    } catch (err) {
      console.error('Error deleting trade:', err);
      setStatus('Error');
    }
  };

  const performance = async () => {
    // compute aggregated metrics
    const perf = await capitalBuildingDB.getTradePerformance();
    return perf;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-crypto-card w-full max-w-3xl mx-4 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Trades — {date}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <select value={form.exchange} onChange={(e) => setForm(f => ({ ...f, exchange: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">
            {EXCHANGES.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <input placeholder="Pair (e.g., BTC/USDT)" value={form.pair} onChange={(e) => setForm(f => ({ ...f, pair: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <select value={form.tradeType} onChange={(e) => setForm(f => ({ ...f, tradeType: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">
            {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select value={form.direction} onChange={(e) => setForm(f => ({ ...f, direction: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">
            {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input placeholder="Entry Price" value={form.entryPrice} onChange={(e) => setForm(f => ({ ...f, entryPrice: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Exit Price" value={form.exitPrice} onChange={(e) => setForm(f => ({ ...f, exitPrice: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Size" value={form.size} onChange={(e) => setForm(f => ({ ...f, size: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-300">{status}</div>
          <div className="flex items-center space-x-2">
            <button onClick={handleSave} className="flex items-center bg-crypto-blue hover:bg-blue-600 text-white px-3 py-2 rounded"><Save className="w-4 h-4 mr-2" /> Save</button>
          </div>
        </div>

        <div className="max-h-64 overflow-auto space-y-2">
          {trades.length === 0 ? (
            <div className="text-sm text-gray-400">No trades for this date.</div>
          ) : (
            trades.map(t => (
              <div key={t.id} className="bg-gray-800/40 p-3 rounded flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{t.exchange} — {t.pair}</div>
                  <div className="text-sm text-gray-400">PNL: {formatCurrency(t.PNL_USDT || 0)} — {t.tradeType} {t.direction}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setForm({ tradeId: t.tradeId, exchange: t.exchange, pair: t.pair, tradeType: t.type, direction: t.direction, entryPrice: t.entryPrice, exitPrice: t.exitPrice, size: t.size, notes: t.notes }); setEditingId(t.id); }} className="px-2 py-1 rounded bg-gray-600">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TradesManager;
