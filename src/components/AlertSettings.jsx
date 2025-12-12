import React, { useEffect, useState } from 'react';
import alertService from '../services/alertService';
import capitalBuildingDB from '../services/capitalBuildingDb';
import { Save, X } from 'lucide-react';

const AlertSettings = ({ onClose }) => {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Start with service defaults, then overlay persisted config
    const load = async () => {
      const defaults = JSON.parse(JSON.stringify(alertService.alertConfig || {}));
      try {
        const persisted = await capitalBuildingDB.getSetting('alertConfig');
        if (persisted) {
          setConfig({ ...defaults, ...persisted });
        } else {
          setConfig(defaults);
        }
      } catch (err) {
        console.warn('Could not load persisted alert config', err);
        setConfig(defaults);
      }
    };
    load();
  }, []);

  const update = (path, value) => {
    setConfig(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = { ...(cur[p] || {}) };
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = Number(value);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      // Update runtime config
      alertService.alertConfig = { ...alertService.alertConfig, ...config };
      // Persist to IndexedDB
      await capitalBuildingDB.saveSetting('alertConfig', config);
      setStatus('Saved');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Error saving alert config', err);
      setStatus('Error');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  if (!config || Object.keys(config).length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-crypto-card w-full max-w-2xl mx-4 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Alert Settings</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm text-gray-300 font-semibold mb-2">Price Movement</h4>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" step="0.01" value={config.priceMovement?.threshold5 || 0} onChange={(e) => update('priceMovement.threshold5', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
              <input type="number" step="0.01" value={config.priceMovement?.threshold10 || 0} onChange={(e) => update('priceMovement.threshold10', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
              <input type="number" step="0.01" value={config.priceMovement?.threshold30 || 0} onChange={(e) => update('priceMovement.threshold30', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
            </div>
            <div className="text-xs text-gray-400 mt-1">Set as decimal (0.10 = 10%).</div>
          </div>

          <div>
            <h4 className="text-sm text-gray-300 font-semibold mb-2">Portfolio Value</h4>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" value={config.portfolioValue?.thresholdUp || 0} onChange={(e) => update('portfolioValue.thresholdUp', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
              <input type="number" step="0.01" value={config.portfolioValue?.thresholdDown || 0} onChange={(e) => update('portfolioValue.thresholdDown', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-300 font-semibold mb-2">Allocation Deviation</h4>
            <input type="number" step="0.01" value={config.allocationDeviation?.threshold || 0} onChange={(e) => update('allocationDeviation.threshold', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <h4 className="text-sm text-gray-300 font-semibold mb-2">Sharpe Ratio</h4>
              <input type="number" step="0.1" value={config.sharpeRatio?.threshold || 0} onChange={(e) => update('sharpeRatio.threshold', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
            </div>
            <div>
              <h4 className="text-sm text-gray-300 font-semibold mb-2">Volatility</h4>
              <input type="number" step="1" value={config.volatility?.threshold || 0} onChange={(e) => update('volatility.threshold', e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button onClick={handleSave} className="flex items-center bg-crypto-green hover:bg-green-600 text-black px-4 py-2 rounded font-semibold">
            <Save className="w-4 h-4 mr-2" /> Save
          </button>
          {status && <div className="text-sm text-gray-300">{status}</div>}
        </div>
      </div>
    </div>
  );
};

export default AlertSettings;
