import React, { useState, useEffect } from 'react';
import capitalBuildingDB from '../services/capitalBuildingDb';
import { formatCurrency } from '../utils/portfolioCalculations';
import { PlusCircle, Save, X } from 'lucide-react';

const HoldingsManager = ({ holdings, onSave, onClose }) => {
  const [localHoldings, setLocalHoldings] = useState({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setLocalHoldings(holdings || {});
  }, [holdings]);

  const updateAmount = (symbol, value) => {
    const parsed = parseFloat(value);
    setLocalHoldings(prev => ({ ...prev, [symbol]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  const removeSymbol = (symbol) => {
    const copy = { ...localHoldings };
    delete copy[symbol];
    setLocalHoldings(copy);
  };

  const addSymbol = () => {
    const sym = newSymbol.trim().toUpperCase();
    const amt = parseFloat(newAmount);
    if (!sym) return;
    setLocalHoldings(prev => ({ ...prev, [sym]: Number.isFinite(amt) ? amt : 0 }));
    setNewSymbol('');
    setNewAmount('');
  };

  const handleSave = async () => {
    try {
      if (onSave) await onSave(localHoldings);
      console.log('HoldingsManager: requested save', localHoldings);
      setStatusMsg('Saved');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch (err) {
      console.error('Error saving holdings:', err);
      setStatusMsg('Error');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  const loadFromDb = async () => {
    try {
      const persisted = await capitalBuildingDB.getSetting('holdings');
      console.log('HoldingsManager: loaded from DB', persisted);
      if (persisted) setLocalHoldings(persisted);
      setStatusMsg(persisted ? 'Loaded' : 'No data');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch (err) {
      console.error('Error loading holdings from DB:', err);
      setStatusMsg('Error');
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-crypto-card w-full max-w-2xl mx-4 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Manage Holdings</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 max-h-80 overflow-auto">
          {Object.keys(localHoldings).length === 0 && (
            <div className="text-sm text-gray-400">No holdings yet. Add a token symbol and amount below.</div>
          )}

          {Object.entries(localHoldings).map(([symbol, amount]) => (
            <div key={symbol} className="flex items-center justify-between bg-gray-800/40 rounded-md p-3">
              <div>
                <div className="text-sm text-gray-300 font-semibold">{symbol}</div>
                <div className="text-xs text-gray-400">{formatCurrency((amount || 0) * (1))}</div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => updateAmount(symbol, e.target.value)}
                  className="w-32 px-2 py-1 rounded bg-gray-700 text-white text-sm"
                />
                <button onClick={() => removeSymbol(symbol)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
          <input
            placeholder="Symbol (e.g., BTC)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="px-3 py-2 rounded bg-gray-700 text-white text-sm md:col-span-1"
          />
          <input
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="px-3 py-2 rounded bg-gray-700 text-white text-sm md:col-span-1"
          />
          <button onClick={addSymbol} className="flex items-center justify-center bg-crypto-blue hover:bg-blue-600 text-white px-3 py-2 rounded md:col-span-1">
            <PlusCircle className="w-4 h-4 mr-2" /> Add
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button onClick={loadFromDb} className="px-3 py-2 rounded bg-gray-700 text-white text-sm">Load</button>
          <button onClick={handleSave} className="flex items-center bg-crypto-green hover:bg-green-600 text-black px-4 py-2 rounded font-semibold">
            <Save className="w-4 h-4 mr-2" /> Save
          </button>
          {statusMsg && <div className="text-sm text-gray-300">{statusMsg}</div>}
        </div>
      </div>
    </div>
  );
};

export default HoldingsManager;
