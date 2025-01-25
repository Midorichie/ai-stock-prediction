import { beforeAll } from 'vitest';
import pkg from '@hirosystems/clarinet-sdk-wasm';

beforeAll(async () => {
  try {
    // Directly call initialize if it exists
    if (pkg.initialize) {
      await pkg.initialize();
    } else {
      console.error('No initialization method found in Clarinet SDK WASM');
      throw new Error('SDK initialization failed');
    }
  } catch (error) {
    console.error('Failed to initialize simnet:', error);
    throw error;
  }
});
