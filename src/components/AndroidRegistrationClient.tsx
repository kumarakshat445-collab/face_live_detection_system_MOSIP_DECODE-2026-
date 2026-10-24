/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Android Registration Client (Tablet / Handheld Edition)
 * Conforms to Android Registration Client Architecture (Page 4, 11 of PDF)
 */

import React, { useState } from 'react';
import { 
  Camera, 
  Wifi, 
  WifiOff, 
  Battery, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Lock, 
  Smartphone,
  Sliders,
  ChevronRight,
  User,
  Fingerprint,
  RotateCcw
} from 'lucide-react';
import { DeviceType, LivenessConfiguration, WorkflowType } from '../types/mosip';
import { FaceCaptureModal } from './FaceCaptureModal';

interface AndroidRegistrationClientProps {
  config: LivenessConfiguration;
  isOnline: boolean;
  onToggleOnline: () => void;
  deviceType: DeviceType;
  onChangeDeviceType: (dev: DeviceType) => void;
  onOpenSettings: () => void;
}

export const AndroidRegistrationClient: React.FC<AndroidRegistrationClientProps> = ({
  config,
  isOnline,
  onToggleOnline,
  deviceType,
  onChangeDeviceType,
  onOpenSettings,
}) => {
  const [modalWorkflow, setModalWorkflow] = useState<WorkflowType | null>(null);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'CAPTURE' | 'RESIDENT_INFO' | 'OPERATOR_LOGIN'>('CAPTURE');
  const [supervisorSigned, setSupervisorSigned] = useState<boolean>(false);

  const handleCaptureSuccess = (image: string) => {
    if (modalWorkflow === 'RESIDENT_REGISTRATION') {
      setCapturedFace(image);
    } else if (modalWorkflow === 'SUPERVISOR_AUTHENTICATION') {
      setSupervisorSigned(true);
    }
    setModalWorkflow(null);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-700">
      {/* Android Device Shell & Status Bar */}
      <div className="bg-slate-950 rounded-[28px] overflow-hidden border border-slate-800 text-white min-h-[720px] flex flex-col justify-between">
        {/* Android Status Bar */}
        <div className="px-6 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-900">
          <span>09:42</span>
          <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto"></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onToggleOnline} className="hover:text-white">
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            </button>
            <div className="flex items-center gap-0.5">
              <span>94%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* MOSIP Android App Header */}
        <div className="bg-orange-600 px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white text-orange-600 font-black flex items-center justify-center text-xs shadow-xs">
              M
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">MOSIP Mobile RegApp</div>
              <div className="text-[10px] text-orange-100 flex items-center gap-1">
                Field Station #402 • {isOnline ? 'Online Sync' : 'Offline Storage'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-orange-700 hover:bg-orange-800 text-white"
            title="Policy Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        {/* Android Navigation Tabs */}
        <div className="bg-slate-900 flex text-xs font-semibold border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('CAPTURE')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'CAPTURE'
                ? 'border-orange-500 text-orange-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Face Biometric
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RESIDENT_INFO')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'RESIDENT_INFO'
                ? 'border-orange-500 text-orange-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Resident Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OPERATOR_LOGIN')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'OPERATOR_LOGIN'
                ? 'border-orange-500 text-orange-400 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Auth & Supervisor
          </button>
        </div>

        {/* Android Body Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'CAPTURE' && (
            <div className="space-y-4">
              {/* Resident Card Mini */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono">REG-2026-8812</span>
                  <div className="text-xs font-bold text-slate-200">Kavita Narayanan</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  Android L0/L1
                </span>
              </div>

              {/* Face Biometric Surface */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col items-center">
                <div className="w-full aspect-4/3 rounded-xl bg-slate-950 overflow-hidden relative border border-slate-800 flex items-center justify-center mb-3">
                  {capturedFace ? (
                    <img
                      src={capturedFace}
                      alt="Captured Face"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-center p-3">
                      <div className="w-24 h-32 rounded-[50%/60%_60%_40%_40%] border-2 border-dashed border-orange-500/60 flex items-center justify-center mb-2">
                        <Camera className="w-7 h-7 text-orange-400" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">Ready for Live Capture</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Passive check & dynamic facial challenges
                      </span>
                    </div>
                  )}

                  {capturedFace && (
                    <div className="absolute bottom-2 left-2 right-2 bg-emerald-950/90 border border-emerald-500/80 rounded-lg p-1.5 text-center text-[10px] text-emerald-200 font-mono">
                      ✓ ISO 30107 PAD PASSED
                    </div>
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-3 font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Liveness Mode</span>
                    <span className="text-slate-200 font-bold">Hybrid Auto</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Threshold</span>
                    <span className="text-slate-200 font-bold">
                      {(config.residentPolicy.passiveThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalWorkflow('RESIDENT_REGISTRATION')}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-98 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  {capturedFace ? 'Re-verify Face Biometric' : 'Launch Android Face Capture'}
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  MOSIP Android client runs edge facial action & PAD algorithms without cellular connectivity.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'RESIDENT_INFO' && (
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-200 text-sm block border-b border-slate-800 pb-2">
                Resident Demographic Record
              </span>
              <div>
                <span className="text-slate-500 block text-[10px]">Full Name</span>
                <span className="text-slate-200 font-medium">Kavita Narayanan</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Date of Birth</span>
                <span className="text-slate-200 font-medium">1996-11-20 (Age 29)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Residential Address</span>
                <span className="text-slate-200 font-medium">
                  Sector 4, Mysore Road, Ramanagara District
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('CAPTURE')}
                className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Proceed to Biometrics
              </button>
            </div>
          )}

          {activeTab === 'OPERATOR_LOGIN' && (
            <div className="space-y-4">
              {/* Operator Auth */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-xs block">
                  Operator Facial Authentication
                </span>
                <p className="text-[11px] text-slate-400">
                  Daily biometric sign-in to unlock the Android registration device.
                </p>
                <button
                  type="button"
                  onClick={() => setModalWorkflow('OPERATOR_AUTHENTICATION')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Authenticate Operator
                </button>
              </div>

              {/* Supervisor Sign-off */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-xs block">
                  Supervisor Authorization
                </span>
                <p className="text-[11px] text-slate-400">
                  Required for packet sign-off or exception override.
                </p>
                {supervisorSigned ? (
                  <div className="p-2 bg-emerald-950/80 border border-emerald-500 rounded-lg text-center text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Supervisor Signed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalWorkflow('SUPERVISOR_AUTHENTICATION')}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Supervisor Biometric Sign-off
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Android Navigation Bar */}
        <div className="px-6 py-2 bg-black flex items-center justify-around text-slate-500">
          <div className="w-3 h-3 border-b-2 border-l-2 border-slate-500 -rotate-45"></div>
          <div className="w-3 h-3 rounded-full border-2 border-slate-500"></div>
          <div className="w-3 h-3 border-2 border-slate-500"></div>
        </div>
      </div>

      {modalWorkflow && (
        <FaceCaptureModal
          isOpen={true}
          workflow={modalWorkflow}
          config={config}
          deviceType={deviceType}
          isOnline={isOnline}
          residentName="Kavita Narayanan"
          onSuccess={handleCaptureSuccess}
          onCancel={() => setModalWorkflow(null)}
        />
      )}
    </div>
  );
};
