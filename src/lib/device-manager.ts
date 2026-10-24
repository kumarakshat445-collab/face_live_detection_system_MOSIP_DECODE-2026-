/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Biometric Device Integration Framework
 * Common Face Capture Device Interface & Device Adapter Pattern (L0 / L1 / Mock)
 */

import { AttackType, DeviceType, FaceFrameData } from '../types/mosip';
import { generateSyntheticFrame } from './liveness-engine';

export interface DeviceStatus {
  connected: boolean;
  streaming: boolean;
  deviceType: DeviceType;
  modelName: string;
  firmwareVersion: string;
  hasHardwareCryptoToken: boolean;
  error?: string;
}

export interface IFaceCaptureDevice {
  deviceType: DeviceType;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  startFrameStream(onFrame: (frame: FaceFrameData) => void): Promise<boolean>;
  stopFrameStream(): void;
  getStatus(): DeviceStatus;
  injectAttack(attack: AttackType): void;
  simulateAction(action: 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'LOOK_UP' | 'LOOK_DOWN'): void;
}

/**
 * Mock L0/L1 Biometric Device Adapter for automated testing, development and attacks simulation
 */
export class MockBiometricDeviceAdapter implements IFaceCaptureDevice {
  public deviceType: DeviceType;
  private streaming = false;
  private connected = true;
  private intervalId: number | null = null;
  private currentAttack: AttackType = 'NONE_BONA_FIDE';
  private onFrameCallback: ((frame: FaceFrameData) => void) | null = null;
  private simulatedBlink = false;
  private simulatedSmile = false;
  private simulatedYaw = 0;
  private simulatedPitch = 0;
  private simulatedGaze: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' = 'CENTER';

  constructor(type: DeviceType = 'L1_SECURE_BIOMETRIC_DEVICE') {
    this.deviceType = type;
  }

  public async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  public async disconnect(): Promise<void> {
    this.stopFrameStream();
    this.connected = false;
  }

  public async startFrameStream(onFrame: (frame: FaceFrameData) => void): Promise<boolean> {
    if (!this.connected) return false;
    this.onFrameCallback = onFrame;
    this.streaming = true;

    if (this.intervalId) clearInterval(this.intervalId);

    // Stream 15 frames per second
    this.intervalId = window.setInterval(() => {
      if (!this.streaming || !this.onFrameCallback) return;

      const base = generateSyntheticFrame(this.currentAttack, this.deviceType === 'L1_SECURE_BIOMETRIC_DEVICE');

      // Inject simulated actions if present
      base.facialActions.blinkDetected = this.simulatedBlink;
      base.facialActions.smileDetected = this.simulatedSmile;
      base.facialActions.headYaw = this.simulatedYaw;
      base.facialActions.headPitch = this.simulatedPitch;
      base.facialActions.gazeDirection = this.simulatedGaze;

      this.onFrameCallback(base);
    }, 100);

    return true;
  }

  public stopFrameStream(): void {
    this.streaming = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getStatus(): DeviceStatus {
    return {
      connected: this.connected,
      streaming: this.streaming,
      deviceType: this.deviceType,
      modelName:
        this.deviceType === 'L1_SECURE_BIOMETRIC_DEVICE'
          ? 'MOSIP L1 Secure Biometric Sensor (Cryptographic TPM 2.0)'
          : 'Standard L0 USB Camera Abstraction',
      firmwareVersion: 'v2.4.1-mosip-certified',
      hasHardwareCryptoToken: this.deviceType === 'L1_SECURE_BIOMETRIC_DEVICE',
    };
  }

  public injectAttack(attack: AttackType): void {
    this.currentAttack = attack;
  }

  public simulateAction(action: 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'LOOK_UP' | 'LOOK_DOWN'): void {
    // Reset any previous action
    this.simulatedBlink = false;
    this.simulatedSmile = false;
    this.simulatedYaw = 0;
    this.simulatedPitch = 0;
    this.simulatedGaze = 'CENTER';

    if (action === 'BLINK') {
      this.simulatedBlink = true;
    } else if (action === 'SMILE') {
      this.simulatedSmile = true;
    } else if (action === 'TURN_LEFT') {
      this.simulatedYaw = -28;
    } else if (action === 'TURN_RIGHT') {
      this.simulatedYaw = 28;
    } else if (action === 'LOOK_UP') {
      this.simulatedPitch = 20;
      this.simulatedGaze = 'UP';
    } else if (action === 'LOOK_DOWN') {
      this.simulatedPitch = -20;
      this.simulatedGaze = 'DOWN';
    }

    // Auto return to neutral after 1.5 seconds
    setTimeout(() => {
      this.simulatedBlink = false;
      this.simulatedSmile = false;
      this.simulatedYaw = 0;
      this.simulatedPitch = 0;
      this.simulatedGaze = 'CENTER';
    }, 1500);
  }
}

/**
 * Real Webcam L0/L1 Adapter using HTML5 mediaDevices with software analysis fallback
 */
export class LiveWebcamDeviceAdapter implements IFaceCaptureDevice {
  public deviceType: DeviceType;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private streaming = false;
  private connected = false;
  private intervalId: number | null = null;
  private onFrameCallback: ((frame: FaceFrameData) => void) | null = null;
  private currentAttack: AttackType = 'NONE_BONA_FIDE';

  constructor(type: DeviceType = 'L0_BASIC_CAMERA') {
    this.deviceType = type;
  }

  public async connect(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        this.connected = true;
        return true;
      }
      return false;
    } catch {
      // Permission denied or camera unavailable
      this.connected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.stopFrameStream();
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.connected = false;
  }

  public async startFrameStream(onFrame: (frame: FaceFrameData) => void): Promise<boolean> {
    if (!this.stream && !(await this.connect())) {
      return false;
    }

    this.onFrameCallback = onFrame;
    this.streaming = true;

    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.autoplay = true;
      this.videoEl.playsInline = true;
      this.videoEl.muted = true;
      this.videoEl.srcObject = this.stream;
      await this.videoEl.play().catch(() => {});
    }

    if (!this.canvasEl) {
      this.canvasEl = document.createElement('canvas');
      this.canvasEl.width = 640;
      this.canvasEl.height = 480;
    }

    this.intervalId = window.setInterval(() => {
      if (!this.streaming || !this.onFrameCallback || !this.videoEl || !this.canvasEl) return;

      const ctx = this.canvasEl.getContext('2d');
      let brightness = 0.5;
      let frameImage: string | undefined;

      if (ctx && this.videoEl.readyState >= 2) {
        ctx.drawImage(this.videoEl, 0, 0, 640, 480);
        frameImage = this.canvasEl.toDataURL('image/jpeg', 0.6);

        // Calculate simple luminance check
        try {
          const imgData = ctx.getImageData(260, 180, 120, 120);
          let sum = 0;
          for (let i = 0; i < imgData.data.length; i += 4) {
            sum += (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
          }
          brightness = sum / ((imgData.data.length / 4) * 255);
        } catch {}
      }

      const synthetic = generateSyntheticFrame(this.currentAttack, this.deviceType === 'L1_SECURE_BIOMETRIC_DEVICE');
      synthetic.capturedImageDataUrl = frameImage;
      synthetic.qualityMetrics.illumination = Math.max(0.2, Math.min(0.98, brightness));

      this.onFrameCallback(synthetic);
    }, 120);

    return true;
  }

  public stopFrameStream(): void {
    this.streaming = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getStatus(): DeviceStatus {
    return {
      connected: this.connected,
      streaming: this.streaming,
      deviceType: this.deviceType,
      modelName: 'Integrated Client Camera (L0 WebRTC)',
      firmwareVersion: '1.0.0-os-native',
      hasHardwareCryptoToken: false,
    };
  }

  public injectAttack(attack: AttackType): void {
    this.currentAttack = attack;
  }

  public simulateAction(_action: string): void {
    // Live webcam relies on real user movement or synthetic simulation toggle
  }

  public getMediaStream(): MediaStream | null {
    return this.stream;
  }
}
