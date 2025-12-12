import React, { useState, useEffect } from 'react';
import capitalBuildingDB from '../services/capitalBuildingDb';
import { formatCurrency } from '../utils/portfolioCalculations';
import { Save, X } from 'lucide-react';

const ACTIVITY_TYPES = ['Work', 'Sale', 'Investment', 'Mining', 'Gift'];

const ActivitiesManager = ({ onClose, onSaved }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ platformName: '', activityType: ACTIVITY_TYPES[0], amountUSDT: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { loadEntries(); }, [date]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await capitalBuildingDB.getActivitiesByDate(date);
      setEntries(data || []);
      setStatus('Loaded');
      setTimeout(() => setStatus(''), 800);
    } catch (err) {
      console.error('Error loading activities:', err);
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const payload = {
      date,
      platformName: form.platformName.trim(),
      activityType: form.activityType,
      amountUSDT: Number(form.amountUSDT) || 0,
      notes: form.notes || '',
      timestamp: new Date().toISOString()
    };

    if (!payload.platformName || payload.amountUSDT <= 0) {
      setStatus('Enter platform and amount > 0');
      setTimeout(() => setStatus(''), 1500);
      return;
    }

    try {
      const id = await capitalBuildingDB.addActivity(payload);
      payload.id = id;
      setStatus('Saved');
      setForm({ platformName: '', activityType: ACTIVITY_TYPES[0], amountUSDT: '', notes: '' });
      await loadEntries();
      if (onSaved) onSaved(payload, { action: 'add' });
      setTimeout(() => setStatus(''), 1200);
    } catch (err) {
      console.error('Error saving activity:', err);
      setStatus('Error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await capitalBuildingDB.delete('activities', id);
      setStatus('Deleted');
      await loadEntries();
      if (onSaved) onSaved({ id }, { action: 'delete' });
      setTimeout(() => setStatus(''), 1000);
    } catch (err) {
      console.error('Error deleting activity:', err);
      setStatus('Error');
    }
  };

  const total = entries.reduce((s, e) => s + ((e.amountUSDT || 0) > 0 ? e.amountUSDT : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-crypto-card w-full max-w-3xl mx-4 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Activities — {date}</h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setDate(new Date().toISOString().split('T')[0]); loadEntries(); }} className="px-2 py-1 rounded bg-gray-700 text-white text-sm">Today</button>
            <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Platform (e.g., Fiverr)" value={form.platformName} onChange={(e) => setForm(f => ({ ...f, platformName: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <select value={form.activityType} onChange={(e) => setForm(f => ({ ...f, activityType: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">
            {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input placeholder="Amount (USDT)" type="number" step="any" value={form.amountUSDT} onChange={(e) => setForm(f => ({ ...f, amountUSDT: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm md:col-span-3" />
        </div>

        <div className="flex items-center justify-end space-x-2 mb-4">
          <span className="text-sm text-gray-300">Daily Total: <strong className="text-white">{formatCurrency(total)}</strong></span>
          <button onClick={handleAdd} className="flex items-center bg-crypto-blue hover:bg-blue-600 text-white px-3 py-2 rounded">
            <Save className="w-4 h-4 mr-2" /> Add
          </button>
          {status && <div className="text-sm text-gray-300">{status}</div>}
        </div>

        <div className="max-h-64 overflow-auto space-y-3">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            entries.filter(e => (e.amountUSDT || 0) > 0).length === 0 ? (
              <div className="text-sm text-gray-400">No activities for this date.</div>
            ) : (
              entries.filter(e => (e.amountUSDT || 0) > 0).map(e => (
                <div key={e.id} className="flex items-center justify-between bg-gray-700/30 p-2 rounded">
                  <div>
                    <div className="text-sm text-white">{e.platformName} — {e.activityType}</div>
                    <div className="text-xs text-gray-400">{formatCurrency(e.amountUSDT || 0)} — {e.notes}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleDelete(e.id)} className="px-2 py-1 rounded bg-red-600 text-sm text-white">Delete</button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesManager;
