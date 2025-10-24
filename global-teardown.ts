import { FullConfig } from '@playwright/test';
import { ChildProcess } from 'child_process';

async function globalTeardown(config: FullConfig) {
  const stripeListenerProcess = (global as any).__STRIPE_LISTENER_PROCESS__ as ChildProcess | null;

  if (stripeListenerProcess) {
    console.log('🛑 Stopping global Stripe webhook listener...');
    stripeListenerProcess.kill('SIGTERM');
    (global as any).__STRIPE_LISTENER_PROCESS__ = null;
  }
}

export default globalTeardown;
