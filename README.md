# BioPAD & FaceSecure — Face Liveness & Presentation Attack Detection (PAD)

> **MOSIP Decode 2026 Hackathon Submission**  
> *Problem Statement 04: Face Liveness Detection and Presentation Attack Detection for Registration and Biometric Authentication*

---

## 🔗 Live Interactive Prototype

👉 **[Open Live Prototype Demo](https://mosip-face-liveness-presentation-attack-detection.ai.studio)**

Experience the full interactive prototype demonstrating:
* **Webcam & Face Stream Processing**: Real-time facial frame analysis.
* **Passive + Dynamic Active Challenges**: Automated prompts (*Blink, Smile, Head Yaw, Head Pitch*).
* **L0/L1 Device Simulator & Test Harness**: Attack injection simulation (*Printed Photos, Screen Replay, 3D Silicone Masks*).
* **ISO 30107 Telemetry Console & Multimodal Deep PAD Audit**.

---

## 📌 Executive Overview

**BioPAD & FaceSecure** is an enterprise-grade, ISO/IEC 30107-1/3 and ISO/IEC 19794-5 compliant **Face Liveness and Presentation Attack Detection (PAD)** system engineered specifically for the MOSIP Desktop and Android Registration Clients[cite: 4, 15]. 

The system implements a hybrid **Passive + Dynamic Active Challenge** architecture that inspects high-frequency frame streams from L0/L1 biometric devices to verify physical presence and thwart spoofing attempts across Resident Registration, Operator Authentication, and Supervisor Authentication workflows[cite: 4, 6].

---

## 🚀 Key System Features & Capabilities

### 1. 🔍 Hybrid Liveness Architecture (Passive + Dynamic Active)
* **Passive Liveness**: Real-time spectral, spatial, and micro-movement analysis of facial frame streams without forcing user interaction.
* **Dynamic Active Challenge Engine**: Automatically triggers dynamic facial challenges (*Blink, Smile, Head Yaw Left/Right, Pitch Up/Down, Nod*) when passive confidence falls below policy thresholds[cite: 4, 5].
* **Unpredictable Challenge Generation**: Prevents pre-recorded script attacks by dynamically selecting challenge sequences server-side/engine-side[cite: 5].

### 2. 🛡️ ISO/IEC 30107 Presentation Attack Protection (PAD)
Detects and neutralizes major biometric spoofing vectors[cite: 5, 8]:
* **Printed Photo Attacks**: Paper, glossy prints, and cutout masks (detects color gamut truncation, edge seam discontinuities, and lack of micro-tremor)[cite: 5].
* **Screen Replay Attacks**: OLED/LCD display replays (detects moiré spatial interference, pixel grids, and glass specular reflection highlights)[cite: 5].
* **3D Mask & Video Replays**: Silicone/latex masks and video loops (detects unnatural surface sheen and lack of biological subsurface light scattering)[cite: 5].
* **Virtual Camera Injections**: Cryptographic frame verification for L1 hardware devices using ECC-256 signatures to reject stream injection.

### 3. 🌐 Offline-First Capability
* **Local On-Device Engine**: Core liveness evaluation, active challenge generation, and action detection run locally on field terminals[cite: 7].
* **Zero Connectivity Dependency**: Ensures identical security policy enforcement across both online and offline registration environments[cite: 7].

### 4. 🎛️ Multi-Workflow Liveness Policy Matrix
Configurable security thresholds per role[cite: 7, 10]:
* **Resident Registration**: High-throughput passive validation with fallback challenge prompt[cite: 5, 6].
* **Operator Authentication**: Stricter passive threshold with forced active verification[cite: 6].
* **Supervisor Authentication**: Enforces MDS L1 hardware device binding with cryptographic signature verification[cite: 6].

---

## 🏗️ Technical Architecture & Workflow
