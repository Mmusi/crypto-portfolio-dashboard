import React, { useState, useEffect } from 'react';
import capitalBuildingDB from '../services/capitalBuildingDb';
import conversionService from '../services/conversionService';
import cryptoApi from '../services/cryptoApi';
import { formatCurrency } from '../utils/portfolioCalculations';
import { PlusCircle, Save, Trash, X } from 'lucide-react';

const CATEGORIES = ['Faucet', 'Mining', 'Task', 'Bot', 'Telegram'];
const DAILY_TARGET = 0.05; // per platform

const DailyEarningsManager = ({ onClose, onSaved }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ platformName: '', tokenName: '', amountToken: '', category: CATEGORIES[0], notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    loadEntries();
  }, [date]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await capitalBuildingDB.getEarningsByDate(date);
      setEntries(data || []);
      setStatus('Loaded');
      setTimeout(() => setStatus(''), 1000);
    } catch (err) {
      console.error('Error loading earnings:', err);
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const computeAmountUSDT = async (token, amount) => {
    const amt = Number(amount) || 0;
    if (amt === 0) return 0;
    // If a date other than today is selected, try to use historical price for accuracy
    const selectedDate = date; // closure var
    const todayStr = new Date().toISOString().split('T')[0];
    // Attempt to resolve coin id first to improve lookup reliability
    try {
      await cryptoApi.resolveCoinId(token);
    } catch (err) {
      // ignore resolution errors, we'll try other fallbacks
    }
    if (selectedDate && selectedDate !== todayStr) {
      try {
        const price = await cryptoApi.getPriceOnDate(token, selectedDate);
        if (price !== null && price !== undefined) return amt * price;
        // mark that we fell back to current price
        setValidationError(`Historical price not found for ${token} on ${selectedDate}; using current price.`);
        setTimeout(() => setValidationError(''), 2000);
      } catch (err) {
        console.warn('Error fetching historical price for computeAmountUSDT', err);
      }
    }

    const val = await conversionService.convertToUSDT(token, amt);
    // If val is 0, try resolving coin id and trying again with resolved id
    if ((val === 0 || Number.isNaN(val)) && !['USDT','USDC','DAI','BUSD'].includes(token)) {
      try {
        const cid = await cryptoApi.resolveCoinId(token);
        if (cid) {
          // ask cryptoApi to get price by resolved id
          const p = await cryptoApi.getPriceOnDate(token, todayStr) || (await cryptoApi.getPrices([token]))[token.toUpperCase()]?.price;
          if (p) return amt * p;
        }
      } catch (err) {
        console.warn('Fallback resolution attempt failed for token', token, err);
      }
    }
    return val;
  };

  const handleAddOrUpdate = async () => {
    if (saving) return; // prevent double clicks
    setValidationError('');
    setSaving(true);

    const token = form.tokenName.trim().toUpperCase();
    const platform = form.platformName.trim();
    const amountToken = Number(form.amountToken) || 0;
    const category = form.category;
    const notes = form.notes || '';
    if (!token || amountToken <= 0) {
      setStatus('Enter token and amount > 0');
      setTimeout(() => setStatus(''), 1500);
      return;
    }

    const amountUSDT = await computeAmountUSDT(token, amountToken);
    console.debug('DailyEarningsManager: computeAmountUSDT ->', { token, amountToken, amountUSDT, date });
    // If conversion failed (no price found), warn and block save
    if ((amountUSDT === 0 || Number.isNaN(amountUSDT)) && !['USDT','USDC','DAI','BUSD'].includes(token)) {
      setValidationError(`No USD price found for token '${token}'. Please check the token symbol.`);
      setSaving(false);
      setStatus('Price lookup failed');
      setTimeout(() => setStatus(''), 1800);
      return;
    }
    const targetAchieved = amountUSDT >= DAILY_TARGET;

    const payload = {
      id: editingId || undefined,
      date,
      platformName: platform,
      tokenName: token,
      amountToken,
      amountUSDT,
      category,
      notes,
      targetAchieved,
      timestamp: new Date().toISOString()
    };

    try {
      // Client-side duplicate check before attempting to save
      const existingForDate = await capitalBuildingDB.getEarningsByDate(date);
      const duplicate = (existingForDate || []).find(e => (
        (e.tokenName || '').toUpperCase() === (payload.tokenName || '').toUpperCase()
        && (e.platformName || '') === (payload.platformName || '')
        && Number(e.amountToken || 0) === Number(payload.amountToken || 0)
        && (e.category || '') === (payload.category || '')
        && (!editingId || e.id !== editingId)
      ));
      if (duplicate) {
        setValidationError('Duplicate entry detected for this date (same platform, token, amount, category).');
        setStatus('Duplicate');
        setSaving(false);
        if (onSaved) onSaved(duplicate, { action: 'duplicate' });
        await loadEntries();
        setTimeout(() => setStatus(''), 1500);
        return;
      }
      if (editingId) {
        await capitalBuildingDB.update('earnings', payload);
        setStatus('Updated');
        if (onSaved) onSaved(payload, { action: 'update' });
      } else {
        const id = await capitalBuildingDB.addEarning(payload);
        payload.id = id;
        if (id && id === payload.id) {
          // If DB returned an existing id (duplicate detected by DB) addEarning returned existing id
          setStatus('Duplicate (existing entry)');
          if (onSaved) onSaved(payload, { action: 'duplicate' });
        } else {
          setStatus('Saved');
          if (onSaved) onSaved(payload, { action: 'add' });
        }
      }
      // Verify persistence and log to help debugging
      try {
        const saved = await capitalBuildingDB.getEarningsByDate(payload.date);
        console.debug('DailyEarningsManager: saved earnings for date', payload.date, saved);
      } catch (err) {
        console.warn('DailyEarningsManager: could not verify saved earnings', err);
      }
      setForm({ platformName: '', tokenName: '', amountToken: '', category: CATEGORIES[0], notes: '' });
      setEditingId(null);
      await loadEntries();
      setTimeout(() => setStatus(''), 1200);
      setSaving(false);
    } catch (err) {
      console.error('Error saving earning:', err);
      setStatus('Error');
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({ platformName: entry.platformName, tokenName: entry.tokenName, amountToken: entry.amountToken, category: entry.category, notes: entry.notes });
  };

  const handleDelete = async (id) => {
    try {
      await capitalBuildingDB.delete('earnings', id);
      setStatus('Deleted');
      await loadEntries();
      if (onSaved) onSaved({ id }, { action: 'delete' });
      setTimeout(() => setStatus(''), 1000);
    } catch (err) {
      console.error('Error deleting earning:', err);
      setStatus('Error');
    }
  };

  const platformTotals = entries.reduce((acc, e) => {
    if ((e.amountUSDT || 0) > 0) acc[e.platformName] = (acc[e.platformName] || 0) + (e.amountUSDT || 0);
    return acc;
  }, {});

  const totalDaily = Object.values(platformTotals).reduce((s, v) => s + v, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-crypto-card w-full max-w-3xl mx-4 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Daily Earnings — {date}</h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setDate(new Date().toISOString().split('T')[0]); loadEntries(); }} className="px-2 py-1 rounded bg-gray-700 text-white text-sm">Today</button>
            <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Platform (e.g. FaucetCrypto)" value={form.platformName} onChange={(e) => setForm(f => ({ ...f, platformName: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input placeholder="Token (e.g. USDT)" value={form.tokenName} onChange={(e) => setForm(f => ({ ...f, tokenName: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Amount" type="number" step="any" value={form.amountToken} onChange={(e) => setForm(f => ({ ...f, amountToken: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm" />
          <input placeholder="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white text-sm md:col-span-2" />
        </div>

        <div className="flex items-center justify-end space-x-2 mb-4">
          <span className="text-sm text-gray-300">Daily Total: <strong className="text-white">{formatCurrency(totalDaily)}</strong></span>
          <div className="flex items-center space-x-2">
            {validationError && <div className="text-sm text-yellow-300 mr-2">{validationError}</div>}
            <button onClick={handleAddOrUpdate} disabled={saving} className={`flex items-center ${saving ? 'opacity-60 cursor-not-allowed' : 'bg-crypto-blue hover:bg-blue-600'} text-white px-3 py-2 rounded`}>
              <Save className="w-4 h-4 mr-2" /> {saving ? (editingId ? 'Updating...' : 'Saving...') : (editingId ? 'Update' : 'Add')}
            </button>
          </div>
          {status && <div className="text-sm text-gray-300">{status}</div>}
        </div>

        <div className="max-h-64 overflow-auto space-y-3">
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : (
            Object.keys(platformTotals).length === 0 ? (
              <div className="text-sm text-gray-400">No entries for this date.</div>
            ) : (
              Object.entries(platformTotals).map(([platform, total]) => (
                <div key={platform} className="bg-gray-800/40 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">{platform}</div>
                      <div className="text-sm text-gray-400">{formatCurrency(total)} total</div>
                    </div>
                    <div className="text-sm text-gray-300">Target: {formatCurrency(DAILY_TARGET)}</div>
                  </div>
                  <div className="mt-2 space-y-2">
                    {entries.filter(e => e.platformName === platform && (e.amountUSDT || 0) > 0).map(e => (
                      <div key={e.id} className="flex items-center justify-between bg-gray-700/30 p-2 rounded">
                        <div>
                          <div className="text-sm text-white">{e.tokenName} {e.amountToken}</div>
                          <div className="text-xs text-gray-400">{formatCurrency(e.amountUSDT)} — {e.category}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleEdit(e)} className="px-2 py-1 rounded bg-gray-600 text-sm">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="px-2 py-1 rounded bg-red-600 text-sm text-white">Delete</button>
                        </div>
                      </div>
                    ))}
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

export default DailyEarningsManager;
