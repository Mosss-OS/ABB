'use client';

import { useEffect, useState } from 'react';
import miniappSdk from '@farcaster/miniapp-sdk';

export default function MiniAppReady({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initMiniApp() {
      try {
        await miniappSdk.actions.ready();
        console.log('[MiniApp] SDK ready');
      } catch (error) {
        console.log('[MiniApp] Not in mini app context');
      }
      setIsReady(true);
    }

    initMiniApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}