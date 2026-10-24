/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Face Liveness Detection and Presentation Attack Detection (PAD) Application
 * Based on MOSIP Decode Problem Statement 04
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Monitor, 
  Smartphone, 
  Sliders, 
  ShieldAlert, 
  BarChart3, 
  Workflow, 
  Wifi, 
  WifiOff, 
  Camera,
  Layers,
  HelpCircle,
  ExternalLink,
  Info,
  Sparkles
} from 'lucide-react';
import { DeviceType, LivenessConfiguration, WorkflowType } from './types/mosip';
import { DEFAULT_CONFIG } from './lib/liveness-engine';
import { DesktopRegistrationClient } from './components/DesktopRegistrationClient';
import { AndroidRegistrationClient } from './components/AndroidRegistrationClient';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { AttackSimulatorPanel } from './components/AttackSimulatorPanel';
import { MetricsAndAuditDashboard } from './components/MetricsAndAuditDashboard';
import { TechnicalArchitectureView } from './components/TechnicalArchitectureView';
import { FaceCaptureModal } from './components/FaceCaptureModal';
import { JudgeLiveFaceDemo } from './components/JudgeLiveFaceDemo';

export default function App() {
  const [platform, setPlatform] = useState<'DESKTOP' | 'ANDROID'>('DESKTOP');
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'JUDGE_DEMO' | 'ATTACK_SIMULATOR' | 'METRICS_AUDIT' | 'CONFIGURATION' | 'ARCHITECTURE'>('JUDGE_DEMO');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('L1_SECURE_BIOMETRIC_DEVICE');
  const [config, setConfig] = useState<LivenessConfiguration>(DEFAULT_CONFIG);
  const [quickCaptureModal, setQuickCaptureModal] = useState<WorkflowType | null>(null);

  const toggleOnline = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top MOSIP Brand Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-600/20">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  MOSIP Face Liveness & PAD System
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold">
                  ISO/IEC 30107
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                04 Face Liveness Detection and Presentation Attack Detection for Registration & Biometric Authentication
              </p>
            </div>
          </div>

          {/* Platform View Toggle & Header Utilities */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop vs Android Switcher */}
            <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setPlatform('DESKTOP');
                  if (activeTab !== 'REGISTRATION') setActiveTab('REGISTRATION');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  platform === 'DESKTOP' && activeTab === 'REGISTRATION'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop Client
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatform('ANDROID');
                  if (activeTab !== 'REGISTRATION') setActiveTab('REGISTRATION');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  platform === 'ANDROID' && activeTab === 'REGISTRATION'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android Client
              </button>
            </div>

            {/* Online/Offline Status Indicator & Toggle */}
            <button
              type="button"
              onClick={toggleOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isOnline
                  ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/70 border-amber-600/60 text-amber-300 hover:bg-amber-900/60'
              }`}
              title="Toggle Online / Offline Field Environment"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Online Synced' : 'Offline Mode'}</span>
            </button>

            {/* Direct Quick Capture Launcher & Judges Face Demo */}
            <button
              type="button"
              onClick={() => setActiveTab('JUDGE_DEMO')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Judges Live Check
            </button>
            <button
              type="button"
              onClick={() => setQuickCaptureModal('RESIDENT_REGISTRATION')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              Modal Capture
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('JUDGE_DEMO')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'JUDGE_DEMO'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Judges Live Face Demo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REGISTRATION')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'REGISTRATION'
                ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Registration Client Workspace
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ATTACK_SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ATTACK_SIMULATOR'
                ? 'bg-slate-800 text-rose-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            PAD Attack Test Suite
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('METRICS_AUDIT')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'METRICS_AUDIT'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ISO 30107 Metrics & Audit Trail
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONFIGURATION')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'CONFIGURATION'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Liveness & PAD Configuration
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Technical Architecture & Flows
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'REGISTRATION' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 px-4 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  Testing MOSIP Client Biometrics: Active environment running{' '}
                  <strong className="text-white">
                    {platform === 'DESKTOP' ? 'Desktop Workstation' : 'Android Tablet'}
                  </strong>{' '}
                  mode with{' '}
                  <strong className="text-orange-300">
                    {deviceType === 'L1_SECURE_BIOMETRIC_DEVICE' ? 'L1 Cryptographic Biometric Sensor' : 'L0 Standard USB Camera'}
                  </strong>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Device:</span>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono"
                >
                  <option value="L1_SECURE_BIOMETRIC_DEVICE">L1 Secure Sensor</option>
                  <option value="L0_BASIC_CAMERA">L0 Standard Camera</option>
                </select>
              </div>
            </div>

            {platform === 'DESKTOP' ? (
              <DesktopRegistrationClient
                config={config}
                isOnline={isOnline}
                onToggleOnline={toggleOnline}
                deviceType={deviceType}
                onChangeDeviceType={setDeviceType}
                onOpenSettings={() => setActiveTab('CONFIGURATION')}
              />
            ) : (
              <AndroidRegistrationClient
                config={config}
                isOnline={isOnline}
                onToggleOnline={toggleOnline}
                deviceType={deviceType}
                onChangeDeviceType={setDeviceType}
                onOpenSettings={() => setActiveTab('CONFIGURATION')}
              />
            )}
          </div>
        )}

        {activeTab === 'JUDGE_DEMO' && <JudgeLiveFaceDemo />}

        {activeTab === 'ATTACK_SIMULATOR' && <AttackSimulatorPanel />}

        {activeTab === 'METRICS_AUDIT' && <MetricsAndAuditDashboard />}

        {activeTab === 'CONFIGURATION' && (
          <ConfigurationPanel config={config} onSave={(newCfg) => setConfig(newCfg)} />
        )}

        {activeTab === 'ARCHITECTURE' && <TechnicalArchitectureView />}
      </main>

      {/* Global Quick Capture Modal (When clicked from top header) */}
      {quickCaptureModal && (
        <FaceCaptureModal
          isOpen={true}
          workflow={quickCaptureModal}
          config={config}
          deviceType={deviceType}
          isOnline={isOnline}
          residentName="Aarav Patel (Quick Verify)"
          onSuccess={(img, auditId) => {
            setQuickCaptureModal(null);
            setActiveTab('METRICS_AUDIT');
          }}
          onCancel={() => setQuickCaptureModal(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            MOSIP Decode 04: Face Liveness Detection & Presentation Attack Detection (PAD)
          </span>
          <span className="font-mono text-slate-400">
            ISO/IEC 30107-1/3:2023 • ISO/IEC 19794-5:2011 • MOSIP MDS 1.2
          </span>
        </div>
      </footer>
    </div>
  );
}
