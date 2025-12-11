import React, { useState } from 'react';
import { Bell, X, AlertCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { ALERT_SEVERITY } from '../types/portfolio';

const AlertsPanel = ({ alerts = [], onDismiss }) => {
  const [filter, setFilter] = useState('all');

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case ALERT_SEVERITY.HIGH:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case ALERT_SEVERITY.MEDIUM:
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
        return 'border-red-600 bg-red-900/20';
      case ALERT_SEVERITY.HIGH:
        return 'border-orange-600 bg-orange-900/20';
      case ALERT_SEVERITY.MEDIUM:
        return 'border-yellow-600 bg-yellow-900/20';
      default:
        return 'border-blue-600 bg-blue-900/20';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === filter);

  const severityCounts = {
    critical: alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL).length,
    high: alerts.filter(a => a.severity === ALERT_SEVERITY.HIGH).length,
    medium: alerts.filter(a => a.severity === ALERT_SEVERITY.MEDIUM).length,
    low: alerts.filter(a => a.severity === ALERT_SEVERITY.LOW).length
  };

  return (
    <div className="bg-crypto-card p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-crypto-blue mr-2" />
          <h3 className="text-xl font-semibold text-white">Active Alerts</h3>
          {alerts.length > 0 && (
            <span className="ml-3 bg-crypto-blue text-white text-xs font-bold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-crypto-blue text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All ({alerts.length})
        </button>
        {severityCounts.critical > 0 && (
          <button
            onClick={() => setFilter(ALERT_SEVERITY.CRITICAL)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === ALERT_SEVERITY.CRITICAL
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Critical ({severityCounts.critical})
          </button>
        )}
        {severityCounts.high > 0 && (
          <button
            onClick={() => setFilter(ALERT_SEVERITY.HIGH)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              filter === ALERT_SEVERITY.HIGH
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            High ({severityCounts.high})
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <p className="text-sm mt-1">Your portfolio is monitoring for changes</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="mr-3 mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold">{alert.message}</p>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                    {alert.action && (
                      <div className="mt-2 bg-gray-700/50 rounded px-3 py-1 inline-block">
                        <p className="text-yellow-300 text-xs font-medium">
                          Recommended: {alert.action.replace(/_/g, ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="ml-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
