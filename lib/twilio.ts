// ./lib/twilio.ts

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not configured');
}

export const twilioClient = twilio(accountSid, authToken);

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  postalCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  price: string;
}

export interface OwnedNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  status: string;
  dateCreated: string;
  voiceUrl?: string;
  smsUrl?: string;
}

export async function searchAvailableNumbers(
  countryCode: string = 'US',
  areaCode?: string, 
  locality?: string
): Promise<AvailableNumber[]> {
  try {
    const numbers = await twilioClient.availablePhoneNumbers(countryCode)
      .local.list({
        areaCode: areaCode ? parseInt(areaCode, 10) : undefined,
        inLocality: locality,
        limit: 20
      });

    return numbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
      postalCode: number.postalCode,
      capabilities: {
        voice: number.capabilities.voice || false,
        sms: number.capabilities.sms || false,
        mms: number.capabilities.mms || false,
      },
      price: '$1.00' // Twilio standard price
    }));
  } catch (error) {
    console.error('Error searching numbers:', error);
    throw new Error('Failed to search available numbers');
  }
}

export async function purchasePhoneNumber(
  phoneNumber: string,
  voiceUrl?: string,
  smsUrl?: string
): Promise<OwnedNumber> {
  try {
    const number = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: voiceUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook`,
      smsUrl: smsUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/sms/webhook`,
    });

    return {
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: {
        voice: number.capabilities.voice || false,
        sms: number.capabilities.sms || false,
        mms: number.capabilities.mms || false,
      },
      status: number.status,
      dateCreated: number.dateCreated.toISOString(),
      voiceUrl: number.voiceUrl,
      smsUrl: number.smsUrl,
    };
  } catch (error) {
    console.error('Error purchasing number:', error);
    throw new Error('Failed to purchase phone number');
  }
}

export async function getOwnedNumbers(): Promise<OwnedNumber[]> {
  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list();

    return numbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: {
        voice: number.capabilities.voice || false,
        sms: number.capabilities.sms || false,
        mms: number.capabilities.mms || false,
      },
      status: number.status,
      dateCreated: number.dateCreated.toISOString(),
      voiceUrl: number.voiceUrl,
      smsUrl: number.smsUrl,
    }));
  } catch (error) {
    console.error('Error fetching owned numbers:', error);
    throw new Error('Failed to fetch owned numbers');
  }
}

export async function releasePhoneNumber(sid: string): Promise<void> {
  try {
    await twilioClient.incomingPhoneNumbers(sid).remove();
  } catch (error) {
    console.error('Error releasing number:', error);
    throw new Error('Failed to release phone number');
  }
}