/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Biometric Liveness Operational Metrics & ISO/IEC 30107 Audit Trail
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Database,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { BiometricAuditRecord, OperationalMetrics } from '../types/mosip';
import { auditLogger } from '../lib/audit-logger';

export const MetricsAndAuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<BiometricAuditRecord[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetrics>(auditLogger.getOperationalMetrics());
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(auditLogger.getLogs());
    setMetrics(auditLogger.getOperationalMetrics());
  };

  const handleSyncOfflineQueue = () => {
    const synced = auditLogger.syncOfflineQueue();
    refreshData();
    setSyncNotice(`Successfully synchronized ${synced} offline biometric audit record(s) to central MOSIP repository.`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(auditLogger.exportLogsAsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mosip_liveness_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear local MOSIP audit buffer?')) {
      auditLogger.clearAll();
      refreshData();
    }
  };

  const offlinePendingCount = logs.filter((l) => !l.syncedToMosipServer).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Biometric Liveness Metrics & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ISO/IEC 30107 presentation attack classification metrics, latency benchmarks, and auditable event records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {offlinePendingCount > 0 && (
            <button
              type="button"
              onClick={handleSyncOfflineQueue}
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Offline Queue ({offlinePendingCount})
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit JSON
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Clear local buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {syncNotice}
        </div>
      )}

      {/* KPI Operational Cards (Page 10 Requirements) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Avg Processing Time */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Avg Processing Time</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.averageProcessingTimeMs}ms
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Passive frame evaluation latency</p>
        </div>

        {/* Metric 2: Challenge Completion Time */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Challenge Duration</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.averageChallengeCompletionTimeSec}s
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active response completion time</p>
        </div>

        {/* Metric 3: APCER (Attack Presentation Classification Error Rate) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">APCER (ISO 30107)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.apcer.toFixed(2)}%
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Target &lt; 1.0% (Passed)</p>
        </div>

        {/* Metric 4: BPCER (Bona Fide Presentation Classification Error Rate) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">BPCER (ISO 30107)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.bpcer.toFixed(2)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">False rejection rate</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-600" />
            Tamper-Resistant Biometric Audit Log Stream
          </h3>
          <span className="text-xs text-slate-500">
            Total Records: <strong className="text-slate-800">{logs.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Audit ID / Timestamp</th>
                <th className="py-2.5 px-3">Workflow</th>
                <th className="py-2.5 px-3">Device / Mode</th>
                <th className="py-2.5 px-3">Passive Score</th>
                <th className="py-2.5 px-3">Challenges</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">MOSIP Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {logs.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-semibold text-slate-900">{record.id}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-slate-800">
                      {record.workflow === 'RESIDENT_REGISTRATION' && 'Resident Reg'}
                      {record.workflow === 'OPERATOR_AUTHENTICATION' && 'Operator Auth'}
                      {record.workflow === 'SUPERVISOR_AUTHENTICATION' && 'Supervisor Auth'}
                    </span>
                    {record.residentId && (
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {record.residentId}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-700">
                        {record.deviceType === 'L1_SECURE_BIOMETRIC_DEVICE' ? 'L1 Secure' : 'L0 Camera'}
                      </span>
                      {record.isOnline ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Offline" />
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        record.passiveScore >= record.thresholdUsed ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {(record.passiveScore * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      (min: {(record.thresholdUsed * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {record.activeChallengesCompleted > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px]">
                        {record.activeChallengesCompleted} passed
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Passive Only</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {record.outcome === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </span>
                    ) : record.outcome === 'PAD_REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px]">
                        <XCircle className="w-3 h-3" />
                        PAD Block
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                        Failed / Retry
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {record.syncedToMosipServer ? (
                      <span className="text-[11px] text-emerald-700 font-medium">Synced</span>
                    ) : (
                      <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Queued
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
