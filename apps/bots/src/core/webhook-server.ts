import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { handleCastEvent } from './cast-handler';

const app = express();
app.use(express.json());

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Webhook] Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

function verifySignature(payload: string, sig: string, secret: string): boolean {
  if (!sig) return false;
  if (!secret) {
    console.warn('[Webhook] NEYNAR_WEBHOOK_SECRET not set');
    return false;
  }
  const hmac = crypto.createHmac('sha512', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === sig;
}

app.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['x-neynar-signature'] as string;
  const raw = JSON.stringify(req.body);
  
  if (!verifySignature(raw, sig, process.env.NEYNAR_WEBHOOK_SECRET || '')) {
    console.warn('[Webhook] Invalid signature received');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const event = req.body;
    await handleCastEvent(event);
    res.json({ ok: true });
  } catch (error) {
    console.error('[Webhook] Error handling cast event:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug', (req: Request, res: Response) => {
  res.json({ 
    env: {
      hasNeynarKey: !!process.env.NEYNAR_API_KEY,
      hasWebhookSecret: !!process.env.NEYNAR_WEBHOOK_SECRET,
      hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
