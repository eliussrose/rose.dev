/**
 * Feature Template
 * Copy this template to create new features
 * @copyright Copyright (c) 2026 Prosinres. All rights reserved.
 */

// ============================================================================
// STEP 1: Define Types
// ============================================================================

export interface MyFeatureConfig {
  enabled: boolean;
  apiKey?: string;
  options: {
    timeout: number;
    retries: number;
  };
}

export interface MyFeatureResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================================================
// STEP 2: Create Feature Class
// ============================================================================

export class MyFeature {
  private config: MyFeatureConfig;
  private isInitialized: boolean = false;

  constructor(config: MyFeatureConfig) {
    this.config = config;
  }

  /**
   * Initialize the feature
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[MyFeature] Already initialized');
      return;
    }

    try {
      // Setup code here
      console.log('[MyFeature] Initializing...');
      
      // Example: Connect to external service
      // await this.connect();
      
      this.isInitialized = true;
      console.log('[MyFeature] Initialized successfully');
    } catch (error) {
      console.error('[MyFeature] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute the main feature logic
   */
  async execute(input: any): Promise<MyFeatureResult> {
    if (!this.isInitialized) {
      throw new Error('Feature not initialized. Call initialize() first.');
    }

    try {
      console.log('[MyFeature] Executing with input:', input);
      
      // Main feature logic here
      const result = await this.processInput(input);
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('[MyFeature] Execution failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process input data
   */
  private async processInput(input: any): Promise<any> {
    // Implementation here
    return input;
  }

  /**
   * Cleanup and dispose resources
   */
  async dispose(): Promise<void> {
    console.log('[MyFeature] Disposing...');
    this.isInitialized = false;
  }

  /**
   * Get feature status
   */
  getStatus(): { initialized: boolean; config: MyFeatureConfig } {
    return {
      initialized: this.isInitialized,
      config: this.config,
    };
  }
}

// ============================================================================
// STEP 3: Export Factory Function
// ============================================================================

export function createMyFeature(config: Partial<MyFeatureConfig> = {}): MyFeature {
  const defaultConfig: MyFeatureConfig = {
    enabled: true,
    options: {
      timeout: 5000,
      retries: 3,
    },
  };

  return new MyFeature({ ...defaultConfig, ...config });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { createMyFeature } from '@/lib/features/my-feature';

// Create instance
const myFeature = createMyFeature({
  enabled: true,
  apiKey: 'your-api-key',
});

// Initialize
await myFeature.initialize();

// Execute
const result = await myFeature.execute({ data: 'test' });

if (result.success) {
  console.log('Result:', result.data);
} else {
  console.error('Error:', result.error);
}

// Cleanup
await myFeature.dispose();
*/
