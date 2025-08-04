/**
 * MQTT Client for UMH Core Integration
 * Connects directly to UMH-Core's internal Kafka/Redpanda via HTTP API
 */

import axios from 'axios';
import { Logger } from 'pino';
import { UMHMessage } from './types/umh-types';

export interface UMHClientOptions {
  umhCoreUrl: string;
  timeout?: number;
  retries?: number;
  logger?: Logger;
}

export class UMHClient {
  private umhCoreUrl: string;
  private timeout: number;
  private retries: number;
  private logger?: Logger;
  private httpClient: any;

  constructor(options: UMHClientOptions) {
    this.umhCoreUrl = options.umhCoreUrl;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
    this.logger = options.logger;

    // Create HTTP client for UMH-Core API
    this.httpClient = axios.create({
      baseURL: this.umhCoreUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CNC-Simulator-UMH/1.0.0'
      }
    });
  }

  /**
   * Connect to UMH-Core (validate connection)
   */
  async connect(): Promise<void> {
    try {
      this.logger?.info('Connecting to UMH-Core...', { url: this.umhCoreUrl });
      
      // Check if UMH-Core is accessible via HTTP health check
      const response = await this.httpClient.get('/health').catch(() => {
        // If /health doesn't exist, try root endpoint
        return this.httpClient.get('/');
      });
      
      this.logger?.info('Successfully connected to UMH-Core', { 
        status: response.status 
      });
    } catch (error) {
      this.logger?.error('Failed to connect to UMH-Core', { 
        error: error instanceof Error ? error.message : error,
        url: this.umhCoreUrl 
      });
      throw new Error(`UMH-Core connection failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Publish UMH message directly to UMH-Core
   * Uses HTTP API to send data into the unified namespace
   */
  async publish(message: UMHMessage): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        // Send message via UMH-Core HTTP API
        // This will be ingested into the unified namespace
        const response = await this.httpClient.post('/api/v1/data', {
          topic: message.topic,
          payload: message.payload,
          metadata: message.metadata,
          timestamp: Date.now()
        });

        this.logger?.debug('Successfully published to UMH-Core', {
          topic: message.topic,
          attempt: attempt,
          status: response.status
        });

        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.logger?.warn('Failed to publish to UMH-Core', {
          topic: message.topic,
          attempt: attempt,
          maxAttempts: this.retries,
          error: lastError.message
        });

        if (attempt < this.retries) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to publish to UMH-Core after ${this.retries} attempts: ${lastError?.message}`);
  }

  /**
   * Publish multiple messages in batch
   */
  async publishBatch(messages: UMHMessage[]): Promise<void> {
    try {
      const batchPayload = {
        messages: messages.map(msg => ({
          topic: msg.topic,
          payload: msg.payload,
          metadata: msg.metadata,
          timestamp: Date.now()
        }))
      };

      const response = await this.httpClient.post('/api/v1/data/batch', batchPayload);
      
      this.logger?.debug('Successfully published batch to UMH-Core', {
        messageCount: messages.length,
        status: response.status
      });
    } catch (error) {
      this.logger?.error('Failed to publish batch to UMH-Core', {
        messageCount: messages.length,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Disconnect from UMH-Core (cleanup)
   */
  async disconnect(): Promise<void> {
    this.logger?.info('Disconnecting from UMH-Core');
    // HTTP client doesn't need explicit disconnection
  }

  /**
   * Check if connected to UMH-Core
   */
  isConnected(): boolean {
    // For HTTP client, we consider it connected if the client exists
    return !!this.httpClient;
  }
}

export default UMHClient;