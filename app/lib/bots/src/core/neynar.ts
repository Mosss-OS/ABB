import axios from 'axios';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

export interface Cast {
  hash: string;
  text: string;
  author: {
    fid: number;
    username: string;
    custody_address: string;
  };
}

export interface CastResponse {
  casts: Cast[];
}

export async function getCastsForUser(fid: number, limit = 10): Promise<Cast[]> {
  if (!NEYNAR_API_KEY) {
    console.log('[neynar] No API key - returning empty casts');
    return [];
  }

  try {
    const response = await axios.get(`${NEYNAR_BASE_URL}/casts`, {
      params: { fid, limit },
      headers: { api_key: NEYNAR_API_KEY },
    });
    return response.data?.casts || [];
  } catch (error) {
    console.error('[neynar] Error fetching casts:', error);
    return [];
  }
}

export async function publishCast(
  signerUuid: string,
  text: string,
  replyTo?: string
): Promise<string> {
  if (!NEYNAR_API_KEY || !signerUuid) {
    console.log('[neynar] No API key or signer - using mock');
    return `mock-${Date.now()}`;
  }

  try {
    const response = await axios.post(
      `${NEYNAR_BASE_URL}/cast`,
      {
        signer_uuid: signerUuid,
        text,
        parent: replyTo || undefined,
      },
      { headers: { api_key: NEYNAR_API_KEY } }
    );
    return response.data?.hash || `mock-${Date.now()}`;
  } catch (error) {
    console.error('[neynar] Error publishing cast:', error);
    return `mock-${Date.now()}`;
  }
}

export async function lookupUser(username: string): Promise<{ fid: number; custodyAddress: string } | null> {
  if (!NEYNAR_API_KEY) return null;

  try {
    const response = await axios.get(`${NEYNAR_BASE_URL}/user-by-username`, {
      params: { username },
      headers: { api_key: NEYNAR_API_KEY },
    });
    const user = response.data?.user;
    return user ? { fid: user.fid, custodyAddress: user.custody_address } : null;
  } catch {
    return null;
  }
}