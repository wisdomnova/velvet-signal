// ./lib/twilioVoice.ts

import { Device } from '@twilio/voice-sdk';

export interface Call {
  sid: string;
  status: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
}

export class TwilioVoiceClient {
  private device: Device | null = null;
  private token: string | null = null;
  private onCallStatusChange?: (call: Call) => void;
  private onIncomingCall?: (call: Call) => void;

  async initialize(accessToken: string) {
    this.token = accessToken;
    this.device = new Device(accessToken, {
      logLevel: 1,
    });
    
    this.device.on('ready', () => {
      console.log('Twilio Device ready');
    });

    this.device.on('error', (error) => {
      console.error('Twilio Device error:', error);
    });

    this.device.on('incoming', (call) => {
      console.log('Incoming call from:', call.parameters.From);
      
      const callData: Call = {
        sid: call.parameters.CallSid || '',
        status: 'ringing',
        direction: 'inbound',
        from: call.parameters.From || '',
        to: call.parameters.To || '',
      };

      if (this.onIncomingCall) {
        this.onIncomingCall(callData);
      }

      call.on('accept', () => {
        console.log('Call accepted');
        if (this.onCallStatusChange) {
          this.onCallStatusChange({ ...callData, status: 'in-progress' });
        }
      });

      call.on('disconnect', () => {
        console.log('Call disconnected');
        if (this.onCallStatusChange) {
          this.onCallStatusChange({ ...callData, status: 'completed' });
        }
      });
    });

    this.device.on('connect', (call) => {
      console.log('Call connected');
    });

    this.device.on('disconnect', (call) => {
      console.log('Call ended');
    });

    await this.device.register();
  }

  async makeCall(phoneNumber: string, fromNumber?: string): Promise<any> {
    if (!this.device) {
      throw new Error('Device not initialized');
    }

    const params: Record<string, string> = {
      To: phoneNumber,
    };

    if (fromNumber) {
      params.From = fromNumber;
    }

    try {
      const call = await this.device.connect({ params });
      
      call.on('accept', () => {
        console.log('Outbound call accepted');
      });

      call.on('disconnect', () => {
        console.log('Outbound call ended');
      });

      return call;
    } catch (error) {
      console.error('Failed to make call:', error);
      throw error;
    }
  }

  setCallStatusHandler(handler: (call: Call) => void) {
    this.onCallStatusChange = handler;
  }

  setIncomingCallHandler(handler: (call: Call) => void) {
    this.onIncomingCall = handler;
  }

  isReady(): boolean {
    return this.device?.state === 'registered';
  }

  disconnect() {
    if (this.device) {
      this.device.disconnectAll();
      this.device.unregister();
    }
  }
}