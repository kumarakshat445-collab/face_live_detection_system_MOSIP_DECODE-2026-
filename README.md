# 🛡️ BioPAD & FaceSecure — Face Liveness & Presentation Attack Detection (PAD)

> **MOSIP Decode 2026 Hackathon Submission**  
> *Problem Statement 04: Face Liveness Detection and Presentation Attack Detection for Registration and Biometric Authentication*

[![Live Interactive Applet](https://img.shields.io/badge/Live%20Demo-AI%20Studio-326ee8?style=for-the-badge&logo=google&logoColor=white)](https://mosip-face-liveness-presentation-attack-detection.ai.studio)
[![ISO/IEC 30107 Compliant](https://img.shields.io/badge/ISO%2FIEC-30107--1%2F3-emerald?style=for-the-badge)](https://www.iso.org/standard/79520.html)
[![ISO/IEC 19794-5](https://img.shields.io/badge/ISO%2FIEC-19794--5-blue?style=for-the-badge)](https://www.iso.org/standard/50864.html)
[![MOSIP Device Level](https://img.shields.io/badge/MOSIP%20MDS-L0%2F L1%20Ready-amber?style=for-the-badge)](https://docs.mosip.io)

---

## 📌 Executive Overview

**BioPAD & FaceSecure** is an enterprise-grade, ISO/IEC 30107-1/3 and ISO/IEC 19794-5 compliant **Face Liveness and Presentation Attack Detection (PAD)** system engineered specifically for the MOSIP Desktop and Android Registration Clients. 

The system implements a hybrid **Passive + Dynamic Active Challenge** architecture that inspects high-frequency frame streams from L0/L1 biometric devices to verify physical presence and thwart spoofing attempts across Resident Registration, Operator Authentication, and Supervisor Authentication workflows.

---

## 🚀 Key System Features & Capabilities

### 1. 🔍 Hybrid Liveness Architecture (Passive + Dynamic Active)
* **Passive Liveness**: Real-time spectral, spatial, and micro-movement analysis of facial frame streams without forcing user interaction.
* **Dynamic Active Challenge Engine**: Automatically triggers dynamic facial challenges (*Blink, Smile, Head Yaw Left/Right, Pitch Up/Down, Nod*) when passive confidence falls below policy thresholds.
* **Unpredictable Challenge Generation**: Prevents pre-recorded script attacks by dynamically selecting challenge sequences server-side/engine-side.

### 2. 🛡️ ISO/IEC 30107 Presentation Attack Protection (PAD)
Detects and neutralizes major biometric spoofing vectors:
* **Printed Photo Attacks**: Paper, glossy prints, and cutout masks (detects color gamut truncation, edge seam discontinuities, and lack of micro-tremor).
* **Screen Replay Attacks**: OLED/LCD display replays (detects moiré spatial interference, pixel grids, and glass specular reflection highlights).
* **3D Mask & Video Replays**: Silicone/latex masks and video loops (detects unnatural surface sheen and lack of biological subsurface light scattering).
* **Virtual Camera Injections**: Cryptographic frame verification for L1 hardware devices using ECC-256 signatures to reject stream injection.

### 3. 🌐 Offline-First Capability
* **Local On-Device Engine**: Core liveness evaluation, active challenge generation, and action detection run locally on field terminals.
* **Zero Connectivity Dependency**: Ensures identical security policy enforcement across both online and offline registration environments.

### 4. 🎛️ Multi-Workflow Liveness Policy Matrix
Configurable security thresholds per role:
* **Resident Registration**: High-throughput passive validation with fallback challenge prompt.
* **Operator Authentication**: Stricter passive threshold with forced active verification.
* **Supervisor Authentication**: Enforces MDS L1 hardware device binding with cryptographic signature verification.

---

## 🏗️ Technical Architecture & Workflow
