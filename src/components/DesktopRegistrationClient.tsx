/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Desktop Registration Client Workspace
 * Conforms to MOSIP Registration Client v1.2.0 UI/UX Architecture
 */

import React, { useState } from 'react';
import { 
  Camera, 
  Fingerprint, 
  Eye, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Clock, 
  Wifi, 
  WifiOff, 
  Lock, 
  Layers, 
  ChevronRight, 
  Building, 
  User, 
  Calendar,
  MapPin,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { DeviceType, LivenessConfiguration, WorkflowType } from '../types/mosip';
import { FaceCaptureModal } from './FaceCaptureModal';

interface DesktopRegistrationClientProps {
  config: LivenessConfiguration;
  isOnline: boolean;
  onToggleOnline: () => void;
  deviceType: DeviceType;
  onChangeDeviceType: (dev: DeviceType) => void;
  onOpenSettings: () => void;
}

export const DesktopRegistrationClient: React.FC<DesktopRegistrationClientProps> = ({
  config,
  isOnline,
  onToggleOnline,
  deviceType,
  onChangeDeviceType,
  onOpenSettings,
}) => {
  const [activeStep, setActiveStep] = useState<'DEMOGRAPHIC' | 'BIOMETRICS' | 'DOCUMENTS' | 'REVIEW'>('BIOMETRICS');
  const [modalWorkflow, setModalWorkflow] = useState<WorkflowType | null>(null);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);
  const [capturedAuditId, setCapturedAuditId] = useState<string | null>(null);
  const [operatorAuthenticated, setOperatorAuthenticated] = useState<boolean>(true);
  const [supervisorApproved, setSupervisorApproved] = useState<boolean>(false);
  const [packetSubmitted, setPacketSubmitted] = useState<boolean>(false);

  // Resident Form mock details
  const [resident, setResident] = useState({
    uin: 'MOSIP-IND-2026-99042',
    fullName: 'Aarav Dev Sharma',
    dob: '1992-06-14',
    gender: 'Male',
    address: 'Flat 402, Royal Palms, MG Road, Bengaluru, Karnataka - 560001',
    mobile: '+91 98765 43210',
  });

  const handleOpenCapture = (wf: WorkflowType) => {
    setModalWorkflow(wf);
  };

  const handleCaptureSuccess = (image: string, auditId: string) => {
    if (modalWorkflow === 'RESIDENT_REGISTRATION') {
      setCapturedFaceImage(image);
      setCapturedAuditId(auditId);
    } else if (modalWorkflow === 'OPERATOR_AUTHENTICATION') {
      setOperatorAuthenticated(true);
    } else if (modalWorkflow === 'SUPERVISOR_AUTHENTICATION') {
      setSupervisorApproved(true);
    }
    setModalWorkflow(null);
  };

  return (
    <div className="bg-slate-100 rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col min-h-[780px]">
      {/* Desktop App Titlebar */}
      <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-orange-600 font-bold flex items-center justify-center text-white text-xs">
            M
          </div>
          <span className="font-semibold text-slate-200">
            MOSIP Registration Client (Desktop Edition v1.2.0)
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400">Center: 10024 - Karnataka Central District</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Biometric Device:</span>
            <select
              value={deviceType}
              onChange={(e) => onChangeDeviceType(e.target.value as DeviceType)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono"
            >
              <option value="L1_SECURE_BIOMETRIC_DEVICE">L1 Secure Biometric Device</option>
              <option value="L0_BASIC_CAMERA">L0 Standard Camera</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleOnline}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Operator & System Ribbon */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              MG
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Operator: Maria Gomez (OP-8821)</div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Biometrically Authenticated with Liveness
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCapture('OPERATOR_AUTHENTICATION')}
            className="text-xs text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md border border-orange-200 transition-colors"
          >
            Re-verify Operator
          </button>
        </div>

        {/* Workflow Stepper */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { key: 'DEMOGRAPHIC', label: '1. Demographics' },
            { key: 'BIOMETRICS', label: '2. Biometric Capture' },
            { key: 'DOCUMENTS', label: '3. Proof Documents' },
            { key: 'REVIEW', label: '4. Supervisor Review' },
          ].map((step, idx) => (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveStep(step.key as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeStep === step.key
                  ? 'bg-orange-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Client Content Area */}
      <div className="p-6 flex-1 overflow-y-auto">
        {activeStep === 'BIOMETRICS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Biometric Modal Capture Station</h3>
                <p className="text-xs text-slate-500">
                  Resident registration packet: <span className="font-mono text-slate-800">{resident.uin}</span> • {resident.fullName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                  ISO/IEC 30107 Level 1/2 Active
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Liveness Policies
                </button>
              </div>
            </div>

            {/* 4 Biometric Modality Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Face Biometric (THE CORE FEATURE FROM PDF SPEC) */}
              <div
                className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all flex flex-col justify-between ${
                  capturedFaceImage
                    ? 'border-emerald-500 shadow-emerald-50'
                    : 'border-orange-500/80 shadow-orange-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Face Biometric & PAD</h4>
                        <span className="text-[10px] text-slate-500 font-mono">ISO/IEC 19794-5 & 30107</span>
                      </div>
                    </div>

                    {capturedFaceImage ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Captured
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Face Preview Area */}
                  <div className="w-full aspect-4/3 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-200 flex items-center justify-center mb-4">
                    {capturedFaceImage ? (
                      <>
                        <img
                          src={capturedFaceImage}
                          alt="Captured face"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur rounded-lg p-2 text-[10px] text-slate-200 flex justify-between font-mono">
                          <span>Quality: 96%</span>
                          <span>Audit: {capturedAuditId?.slice(-6)}</span>
                          <span className="text-emerald-400 font-bold">LIVENESS PASS</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 p-4 text-center">
                        <div className="w-20 h-24 rounded-[50%/60%_60%_40%_40%] border-2 border-dashed border-slate-600 flex items-center justify-center mb-2">
                          <Camera className="w-6 h-6 text-slate-500" />
                        </div>
                        <span className="text-xs font-medium text-slate-300">Face Not Captured</span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Requires hybrid passive & active liveness check
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span>Threshold:</span>
                      <span className="font-mono font-medium">{(config.residentPolicy.passiveThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Policy:</span>
                      <span className="font-medium">Hybrid Auto Escalation</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Device Interface:</span>
                      <span className="font-mono">{deviceType === 'L1_SECURE_BIOMETRIC_DEVICE' ? 'L1 Signed Stream' : 'L0 Camera'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCapture('RESIDENT_REGISTRATION')}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                    capturedFaceImage
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {capturedFaceImage ? 'Re-capture Face Biometric' : 'Start Face Capture & Liveness'}
                </button>
              </div>

              {/* Card 2: Iris Biometrics (Standard MOSIP Modality) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Dual Iris Scanner</h4>
                        <span className="text-[10px] text-slate-500 font-mono">ISO/IEC 19794-6</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Captured
                    </span>
                  </div>

                  <div className="w-full aspect-4/3 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-200 flex items-center justify-around p-4 mb-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-2 border-emerald-400 bg-emerald-950/40 flex items-center justify-center mx-auto mb-1">
                        <Eye className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300">Left Iris: 94%</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-2 border-emerald-400 bg-emerald-950/40 flex items-center justify-center mx-auto mb-1">
                        <Eye className="w-7 h-7 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-300">Right Iris: 96%</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span>Device:</span>
                      <span className="font-mono">IriShield Binocular L1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-emerald-700 font-semibold">Quality Verified</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl font-medium text-xs bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed"
                  disabled
                >
                  Iris Capture Complete
                </button>
              </div>

              {/* Card 3: Fingerprints (Slap & Thumb) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Ten Fingerprint Slaps</h4>
                        <span className="text-[10px] text-slate-500 font-mono">ISO/IEC 19794-4</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Captured
                    </span>
                  </div>

                  <div className="w-full aspect-4/3 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-200 flex items-center justify-center p-4 mb-4">
                    <div className="flex gap-2 items-center">
                      <div className="p-2 bg-slate-800 rounded-lg text-center">
                        <Fingerprint className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[9px] font-mono text-slate-300 block mt-1">Left Slap (4)</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded-lg text-center">
                        <Fingerprint className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[9px] font-mono text-slate-300 block mt-1">Thumbs (2)</span>
                      </div>
                      <div className="p-2 bg-slate-800 rounded-lg text-center">
                        <Fingerprint className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[9px] font-mono text-slate-300 block mt-1">Right Slap (4)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span>Device:</span>
                      <span className="font-mono">MorphoTop 100 L1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NFIQ 2 Quality:</span>
                      <span className="text-emerald-700 font-semibold font-mono">Score 88/100</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl font-medium text-xs bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed"
                  disabled
                >
                  Fingerprints Complete
                </button>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveStep('DEMOGRAPHIC')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Back to Demographics
              </button>

              <div className="flex items-center gap-3">
                {!capturedFaceImage && (
                  <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Face biometric with liveness verification is required
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveStep('REVIEW')}
                  disabled={!capturedFaceImage}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    capturedFaceImage
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Proceed to Supervisor Review
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeStep === 'DEMOGRAPHIC' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Resident Demographic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 font-medium">Full Legal Name</label>
                <input
                  type="text"
                  value={resident.fullName}
                  onChange={(e) => setResident({ ...resident, fullName: e.target.value })}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Date of Birth</label>
                <input
                  type="text"
                  value={resident.dob}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Gender</label>
                <input
                  type="text"
                  value={resident.gender}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Contact Number</label>
                <input
                  type="text"
                  value={resident.mobile}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 font-medium">Residential Address</label>
                <textarea
                  value={resident.address}
                  rows={2}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveStep('BIOMETRICS')}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold"
            >
              Continue to Biometrics
            </button>
          </div>
        )}

        {activeStep === 'REVIEW' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 max-w-3xl">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  MOSIP Registration Packet Finalization
                </h3>
                <p className="text-xs text-slate-500">
                  Review captured biometrics and execute Supervisor Biometric Authentication sign-off.
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded text-slate-700">
                {resident.uin}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Resident Details</span>
                <p><strong className="text-slate-700">Name:</strong> {resident.fullName}</p>
                <p><strong className="text-slate-700">DOB:</strong> {resident.dob}</p>
                <p><strong className="text-slate-700">Address:</strong> {resident.address}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Biometric Status</span>
                <p className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Face Liveness Verified (ISO 30107)
                </p>
                <p className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> Iris Modality Captured
                </p>
                <p className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> 10 Fingerprints Captured
                </p>
              </div>
            </div>

            {/* Supervisor Authentication Section (Page 3 of PDF) */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-700" />
                    Supervisor Biometric Authentication Sign-off (Page 3)
                  </h4>
                  <p className="text-xs text-purple-800 mt-0.5">
                    Ensures supervisor is physically present with live facial verification before packet encryption.
                  </p>
                </div>

                {supervisorApproved ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supervisor Authenticated
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenCapture('SUPERVISOR_AUTHENTICATION')}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    Authenticate Supervisor Face
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveStep('BIOMETRICS')}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to Biometrics
              </button>

              <button
                type="button"
                onClick={() => setPacketSubmitted(true)}
                disabled={!supervisorApproved}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                  supervisorApproved
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {packetSubmitted ? 'Packet Encrypted & Uploaded to MOSIP' : 'Encrypt & Submit Registration Packet'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Face Capture & Liveness Modal */}
      {modalWorkflow && (
        <FaceCaptureModal
          isOpen={true}
          workflow={modalWorkflow}
          config={config}
          deviceType={deviceType}
          isOnline={isOnline}
          residentName={resident.fullName}
          onSuccess={handleCaptureSuccess}
          onCancel={() => setModalWorkflow(null)}
        />
      )}
    </div>
  );
};
