import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const fid = req.headers.get('x-fid');
    const username = req.headers.get('x-username');
    
    if (!fid) {
      return NextResponse.json({ error: 'Unauthorized - No FID provided' }, { status: 401 });
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    let userData = null;
    
    if (neynarApiKey) {
      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/user?fid=${fid}`,
          { headers: { 'x-api-key': neynarApiKey } }
        );
        if (response.ok) {
          const data = await response.json();
          userData = data.user;
        }
      } catch (error) {
        console.error('Error fetching user from Neynar:', error);
      }
    }

    return NextResponse.json({
      fid: parseInt(fid),
      username: username || userData?.username,
      displayName: userData?.displayName,
      pfpUrl: userData?.avatarUrl,
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}