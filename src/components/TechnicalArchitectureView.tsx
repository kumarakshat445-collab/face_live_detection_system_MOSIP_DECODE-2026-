/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Face Liveness and PAD Technical Architecture & System Deliverables
 * Fulfills Deliverables Section 1 (Technical Design & Sequence Diagrams)
 */

import React, { useState } from 'react';
import { 
  FileCode, 
  GitBranch, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  CheckCircle, 
  ArrowRight, 
  Terminal,
  Lock,
  Workflow
} from 'lucide-react';

export const TechnicalArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DECISION_FLOW' | 'SYSTEM_ARCHITECTURE' | 'ISO_STANDARDS' | 'SEQUENCE_DIAGRAMS'>('DECISION_FLOW');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold text-slate-900">
            MOSIP Face Liveness & PAD Technical Architecture
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Architectural specification, ISO/IEC 30107 compliance matrix, and sequence flow diagrams.
        </p>

        {/* Tab navigation */}
        <div className="flex gap-2 mt-4 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('DECISION_FLOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'DECISION_FLOW'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Passive-to-Active Decision Tree
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SYSTEM_ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'SYSTEM_ARCHITECTURE'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            L0/L1 Device Abstraction & Streaming
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ISO_STANDARDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ISO_STANDARDS'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ISO/IEC 30107 & 19794-5 Standards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SEQUENCE_DIAGRAMS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'SEQUENCE_DIAGRAMS'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Workflow Sequence Flows
          </button>
        </div>
      </div>

      {/* Tab 1: Passive to Active Decision Tree */}
      {activeTab === 'DECISION_FLOW' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Hybrid Passive & Active Decision Logic (Pages 1–3 of Specification)
          </h3>
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-4 leading-relaxed">
            <div className="text-orange-400 font-bold text-sm">
              [Device Stream] ➔ L0 / L1 Face Frames Received
            </div>

            <div className="pl-4 border-l-2 border-slate-700 space-y-3">
              <div>
                <span className="text-blue-400 font-bold">STEP 1: ISO 19794-5 Sanity & Quality Check</span>
                <p className="text-slate-400 text-[11px]">
                  Detect single face, lighting uniformity, frontal pose angle, and sharpness &gt; 0.40.
                  If multiple faces or face absent: Return prompt "Face not detected / Multiple faces detected".
                </p>
              </div>

              <div>
                <span className="text-blue-400 font-bold">STEP 2: Presentation Attack Detection (PAD)</span>
                <p className="text-slate-400 text-[11px]">
                  Calculate Moire pattern, paper specular sheen, 2D planar flatness, and motion recurrence.
                  <br />
                  <span className="text-rose-400">➔ If Attack Detected:</span> REJECT immediately. Show generic message "Face verification could not be completed. Please try again." Log attack classification to ISO 30107 audit record.
                </p>
              </div>

              <div>
                <span className="text-blue-400 font-bold">STEP 3: Passive Liveness Confidence Score vs Configured Threshold</span>
                <p className="text-slate-400 text-[11px]">
                  Compare Passive Score (0.0 to 1.0) against Workflow Threshold (Resident: 75%, Operator: 80%, Supervisor: 85%).
                  <br />
                  <span className="text-emerald-400 font-bold">➔ Score &gt;= Threshold:</span> SUCCESS! Proceed with biometric acceptance without requiring user action.
                  <br />
                  <span className="text-amber-400 font-bold">➔ Score &lt; Threshold:</span> AUTOMATICALLY ESCALATE TO ACTIVE LIVENESS.
                </p>
              </div>

              <div>
                <span className="text-blue-400 font-bold">STEP 4: Dynamic Active Challenge Execution</span>
                <p className="text-slate-400 text-[11px]">
                  Registration Client automatically selects an unpredictable challenge sequence (e.g. Blink ➔ Turn Head Left).
                  User does NOT choose the challenge. Real-time feedback guides action.
                  <br />
                  <span className="text-emerald-400">➔ Challenges Passed:</span> ACCEPT face biometric.
                  <br />
                  <span className="text-rose-400">➔ Timed Out / Failed:</span> Increment retry counter (Attempt n of 3).
                  <br />
                  <span className="text-rose-400">➔ Exceeded Max Retries:</span> Route to configured Repeated Failure Behavior (Supervisor biometric override or Exception Queue).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: System Architecture */}
      {activeTab === 'SYSTEM_ARCHITECTURE' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            L0 / L1 Biometric Device Integration Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <Layers className="w-4 h-4 text-orange-600" />
                L0 Biometric Device Abstraction
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects standard USB cameras or OS-native video devices. Uses software-level frame streaming and local feature extraction. Frame rate: 15–30 fps.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                L1 Secure Biometric Device
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hardware-secure biometric sensor with embedded cryptographic processor (TPM 2.0). Every face frame is signed with an asymmetric private key inside hardware secure enclave.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Local Client Edge Engine
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero network dependency. Runs 100% locally on Desktop (Java/Swing) and Android (Kotlin/C++) registration clients so remote field stations operate uninterrupted offline.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
            <span className="font-bold text-slate-800">MOSIP Device Adapter Pattern Interface:</span>
            <pre className="text-[11px] text-slate-700 overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
{`interface IFaceCaptureDevice {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  startFrameStream(onFrame: (frame: FaceFrameData) => void): Promise<boolean>;
  stopFrameStream(): void;
  getStatus(): DeviceStatus;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: ISO Standards */}
      {activeTab === 'ISO_STANDARDS' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Biometric Standards Alignment Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Standard</th>
                  <th className="p-3">Clause / Requirement</th>
                  <th className="p-3">Implementation in Solution</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="p-3 font-semibold text-slate-900 font-mono">ISO/IEC 30107-1:2023</td>
                  <td className="p-3 text-slate-600">PAD Vocabulary & Framework</td>
                  <td className="p-3 text-slate-700">Presentation Attack Species classification (Printed, Screen, Video, Mask).</td>
                  <td className="p-3 text-emerald-600 font-semibold">Compliant</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 font-mono">ISO/IEC 30107-3:2023</td>
                  <td className="p-3 text-slate-600">Testing and Reporting (APCER & BPCER)</td>
                  <td className="p-3 text-slate-700">Quantitative evaluation of false acceptance of attacks and false rejection of live residents.</td>
                  <td className="p-3 text-emerald-600 font-semibold">Compliant</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 font-mono">ISO/IEC 19794-5:2011</td>
                  <td className="p-3 text-slate-600">Face Image Data Quality Standard</td>
                  <td className="p-3 text-slate-700">Frontal pose validation, eye centers open, uniform illumination, blur minimization.</td>
                  <td className="p-3 text-emerald-600 font-semibold">Compliant</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 font-mono">MOSIP MDS Spec 1.2</td>
                  <td className="p-3 text-slate-600">MOSIP Device Service & L1 Security</td>
                  <td className="p-3 text-slate-700">Signed biometric packets with device certificates and tamper evidence.</td>
                  <td className="p-3 text-emerald-600 font-semibold">Compliant</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Sequence Diagrams */}
      {activeTab === 'SEQUENCE_DIAGRAMS' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900">
            Workflows: Resident Registration vs Operator Auth vs Supervisor Auth
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="font-bold text-blue-900 block mb-2">1. Resident Registration</span>
              <ol className="list-decimal list-inside space-y-1.5 text-blue-800">
                <li>Operator clicks "Capture Face"</li>
                <li>Device streams frames</li>
                <li>Passive check (75% threshold)</li>
                <li>If borderline: dynamic active challenge</li>
                <li>Store cryptographically signed face ISO CBEFF</li>
              </ol>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="font-bold text-emerald-900 block mb-2">2. Operator Authentication</span>
              <ol className="list-decimal list-inside space-y-1.5 text-emerald-800">
                <li>Operator initiates daily login</li>
                <li>Camera analyzes live face stream</li>
                <li>Threshold 80% with PAD check</li>
                <li>Guarantees live operator presence</li>
                <li>Unlocks registration workstation</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="font-bold text-purple-900 block mb-2">3. Supervisor Authentication</span>
              <ol className="list-decimal list-inside space-y-1.5 text-purple-800">
                <li>Triggered on packet approval / exception</li>
                <li>High security threshold (85%)</li>
                <li>3-stage unpredictable active challenge</li>
                <li>Zero-replay guarantee</li>
                <li>Cryptographic sign-off on resident packet</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
