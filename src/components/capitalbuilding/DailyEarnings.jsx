import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import capitalBuildingDB from '../../services/capitalBuildingDb';
import conversionService from '../../services/conversionService';

const DailyEarnings = () => {
  const [earnings, setEarnings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    platformName: '',
    tokenName: 'USDT',
    amountToken: '',
    amountUSDT: 0,
    category: 'Faucet',
    notes: '',
    dailyTarget: 0.05,
    targetAchieved: false
  });

  const categories = ['Faucet', 'Mining', 'Task', 'Bot', 'Telegram'];
  const platforms = ['LuckyWatch', 'FaucetCrypto', 'Denet', 'UnMineable', 'Tor Miner', 'Free-Bonk', 'ClaimCoin', 'Autofaucet'];

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const allEarnings = await capitalBuildingDB.getAll('earnings');
      setEarnings(allEarnings.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedData = { ...formData, [name]: newValue };

    // Auto-convert token to USDT
    if (name === 'amountToken' || name === 'tokenName') {
      const amount = name === 'amountToken' ? parseFloat(value) : parseFloat(formData.amountToken);
      const token = name === 'tokenName' ? value : formData.tokenName;
      
      if (amount && token) {
        try {
          const usdtValue = await conversionService.convertToUSDT(token, amount);
          updatedData.amountUSDT = usdtValue;
          updatedData.targetAchieved = usdtValue >= (updatedData.dailyTarget || 0.05);
        } catch (error) {
          console.error('Conversion error:', error);
        }
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await capitalBuildingDB.update('earnings', { ...formData, id: editingId });
      } else {
        await capitalBuildingDB.addEarning(formData);
      }
      
      resetForm();
      loadEarnings();
    } catch (error) {
      console.error('Error saving earning:', error);
    }
  };

  const handleEdit = (earning) => {
    setFormData(earning);
    setEditingId(earning.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this earning entry?')) {
      try {
        await capitalBuildingDB.delete('earnings', id);
        loadEarnings();
      } catch (error) {
        console.error('Error deleting earning:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      platformName: '',
      tokenName: 'USDT',
      amountToken: '',
      amountUSDT: 0,
      category: 'Faucet',
      notes: '',
      dailyTarget: 0.05,
      targetAchieved: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Calculate totals
  const todayTotal = earnings
    .filter(e => e.date === new Date().toISOString().split('T')[0])
    .reduce((sum, e) => sum + (e.amountUSDT || 0), 0);

  const platformTotals = earnings.reduce((acc, e) => {
    if (e.date === new Date().toISOString().split('T')[0]) {
      acc[e.platformName] = (acc[e.platformName] || 0) + (e.amountUSDT || 0);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-crypto-card rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-crypto-green" />
            Daily Earnings
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-crypto-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </button>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-crypto-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm">Today's Total</p>
            <p className="text-2xl font-bold text-crypto-green">${todayTotal.toFixed(4)}</p>
          </div>
          <div className="bg-crypto-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Entries</p>
            <p className="text-2xl font-bold text-white">{earnings.filter(e => e.date === new Date().toISOString().split('T')[0]).length}</p>
          </div>
          <div className="bg-crypto-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm">Targets Met</p>
            <p className="text-2xl font-bold text-crypto-blue">
              {earnings.filter(e => e.date === new Date().toISOString().split('T')[0] && e.targetAchieved).length}
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-crypto-card rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingId ? 'Edit Entry' : 'Add New Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Platform</label>
                <select
                  name="platformName"
                  value={formData.platformName}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                  required
                >
                  <option value="">Select Platform</option>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Token</label>
                <input
                  type="text"
                  name="tokenName"
                  value={formData.tokenName}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="BTC, ETH, USDT"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Amount (Token)</label>
                <input
                  type="number"
                  step="any"
                  name="amountToken"
                  value={formData.amountToken}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="0.0001"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Amount USDT (Auto)</label>
                <input
                  type="number"
                  step="any"
                  name="amountUSDT"
                  value={formData.amountUSDT.toFixed(6)}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-gray-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Daily Target ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="dailyTarget"
                  value={formData.dailyTarget}
                  onChange={handleInputChange}
                  className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="targetAchieved"
                  checked={formData.targetAchieved}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-gray-400">Target Achieved</label>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full bg-crypto-dark border border-gray-600 rounded px-3 py-2 text-white"
                rows="2"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-crypto-green hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Entry
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Earnings List */}
      <div className="bg-crypto-card rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Recent Earnings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Date</th>
                <th className="pb-3">Platform</th>
                <th className="pb-3">Token</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">USDT</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {earnings.slice(0, 20).map(earning => (
                <tr key={earning.id} className="border-b border-gray-800 hover:bg-crypto-dark">
                  <td className="py-3 text-white">{earning.date}</td>
                  <td className="py-3 text-white">{earning.platformName}</td>
                  <td className="py-3 text-crypto-blue">{earning.tokenName}</td>
                  <td className="py-3 text-white">{parseFloat(earning.amountToken).toFixed(6)}</td>
                  <td className="py-3 text-crypto-green">${earning.amountUSDT.toFixed(6)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-crypto-blue bg-opacity-20 text-crypto-blue rounded text-xs">
                      {earning.category}
                    </span>
                  </td>
                  <td className="py-3">
                    {earning.targetAchieved ? (
                      <CheckCircle className="w-5 h-5 text-crypto-green" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600" />
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(earning)}
                        className="text-crypto-blue hover:text-blue-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(earning.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {earnings.length === 0 && (
            <p className="text-gray-400 text-center py-8">No earnings recorded yet. Add your first entry!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyEarnings;
