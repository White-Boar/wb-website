import { spawn, ChildProcess, execSync } from 'child_process';
import { FullConfig } from '@playwright/test';

let stripeListenerProcess: ChildProcess | null = null;

// Helper function to check if stripe listen is already running
function isStripeListenerRunning(): boolean {
  try {
    const result = execSync('pgrep -f "stripe listen"', { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

async function globalSetup(config: FullConfig) {
  // Skip Stripe listener in CI as it's not available
  if (process.env.CI) {
    console.log('ℹ️  Skipping Stripe webhook listener in CI (not available)');
    return;
  }

  if (isStripeListenerRunning()) {
    console.log('✓ Stripe webhook listener already running');
    return;
  }

  console.log('🚀 Starting global Stripe webhook listener...');

  stripeListenerProcess = spawn('stripe', [
    'listen',
    '--forward-to',
    'localhost:3783/api/stripe/webhook'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Set up continuous logging for stdout and stderr
  stripeListenerProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    console.log(`[Stripe] ${output.trim()}`);
  });

  stripeListenerProcess.stderr?.on('data', (data) => {
    console.error(`[Stripe Error] ${data.toString().trim()}`);
  });

  stripeListenerProcess.on('error', (error) => {
    console.error('[Stripe Process Error]', error);
  });

  // Wait for listener to be ready
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stripe listener startup timeout'));
      }, 10000);

      const checkReady = (data: Buffer) => {
        const output = data.toString();
        // Stripe CLI outputs "Ready!" to stderr, also check for webhook signing secret
        if (output.includes('Ready!') || output.includes('webhook signing secret')) {
          clearTimeout(timeout);
          console.log('✓ Global Stripe webhook listener ready');
          stripeListenerProcess!.stdout?.off('data', checkReady);
          stripeListenerProcess!.stderr?.off('data', checkReady);
          resolve();
        }
      };

      // Listen to both stdout and stderr since Stripe CLI uses stderr for status messages
      stripeListenerProcess!.stdout?.on('data', checkReady);
      stripeListenerProcess!.stderr?.on('data', checkReady);
    });
  } catch (error) {
    console.warn('⚠️  Failed to start global Stripe listener:', error);
    console.warn('Webhook events may not be processed during tests');
  }

  // Store the process globally so globalTeardown can access it
  (global as any).__STRIPE_LISTENER_PROCESS__ = stripeListenerProcess;
}

export default globalSetup;
