/**
 * UMH-Core Direct Integration Simulation Service
 * Manages the simulation lifecycle and publishes directly to UMH-Core
 */

import pino from 'pino';
import { CNCDataGeneratorFactory, SensorReading, CNC_MACHINES } from './cnc-data-generator';
import { UMHAdapter, SensorReadingWithMachine } from './umh-adapter';
import { UMHClient } from './mqtt-client';

export interface UMHSimulationConfig {
  umhCoreUrl: string;
  publishInterval: number; // milliseconds
  enableLogging?: boolean;
  outputFormat?: 'umh'; // Only UMH format for direct integration
  batchSize?: number; // Number of messages to batch together
}

export interface SimulationMetrics {
  totalMessagesPublished: number;
  messagesPerSecond: number;
  activeMachines: number;
  uptime: number; // seconds
  errors: string[];
  batchesSent: number;
}

export class UMHSimulationManager {
  private static instance: UMHSimulationManager | null = null;
  private umhClient: UMHClient | null = null;
  private dataFactory: CNCDataGeneratorFactory;
  private publishTimer: NodeJS.Timeout | null = null;
  private logger: pino.Logger;
  private config: UMHSimulationConfig;
  private isRunning = false;
  private startTime: Date;
  private metrics: SimulationMetrics;

  constructor(config: UMHSimulationConfig) {
    this.config = config;
    this.dataFactory = new CNCDataGeneratorFactory();
    this.startTime = new Date();
    this.metrics = {
      totalMessagesPublished: 0,
      messagesPerSecond: 0,
      activeMachines: 0,
      uptime: 0,
      errors: [],
      batchesSent: 0
    };

    // Initialize logger
    this.logger = pino({
      name: 'umh-cnc-simulator',
      level: config.enableLogging ? 'info' : 'error',
      transport: config.enableLogging ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      } : undefined
    });
  }

  /**
   * Static method to start simulation (singleton pattern)
   */
  static async startSimulation(config: UMHSimulationConfig): Promise<void> {
    if (UMHSimulationManager.instance && UMHSimulationManager.instance.isRunning) {
      throw new Error('UMH simulation is already running');
    }

    UMHSimulationManager.instance = new UMHSimulationManager(config);
    await UMHSimulationManager.instance.start();
  }

  /**
   * Static method to stop simulation
   */
  static async stopSimulation(): Promise<void> {
    if (UMHSimulationManager.instance) {
      await UMHSimulationManager.instance.stop();
      UMHSimulationManager.instance = null;
    }
  }

  /**
   * Static method to get metrics
   */
  static getMetrics(): SimulationMetrics | null {
    return UMHSimulationManager.instance?.getMetrics() || null;
  }

  /**
   * Start the simulation
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('UMH simulation is already running');
    }

    this.logger.info('🚀 Starting UMH-Core Direct Integration CNC Simulation Service');
    
    try {
      // Connect to UMH-Core
      await this.connectUMH();
      
      // Start publishing data
      this.startPublishing();
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.logger.info('✅ UMH CNC simulation started successfully', {
        umhCoreUrl: this.config.umhCoreUrl,
        publishInterval: this.config.publishInterval,
        machines: this.dataFactory.getMachines().length,
        batchSize: this.config.batchSize || 1
      });

    } catch (error: any) {
      this.logger.error('❌ Failed to start UMH simulation', { error: error.message });
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Stop the simulation
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('🛑 Stopping UMH CNC simulation...');
    
    this.isRunning = false;
    
    // Stop publishing timer
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = null;
    }

    // Disconnect UMH client
    await this.disconnectUMH();
    
    this.logger.info('✅ UMH CNC simulation stopped');
  }

  /**
   * Connect to UMH-Core
   */
  private async connectUMH(): Promise<void> {
    this.logger.info('🔌 Connecting to UMH-Core...', {
      url: this.config.umhCoreUrl
    });

    this.umhClient = new UMHClient({
      umhCoreUrl: this.config.umhCoreUrl,
      timeout: 10000,
      retries: 3,
      logger: this.logger
    });

    try {
      await this.umhClient.connect();
      this.logger.info('✅ Connected to UMH-Core successfully');
    } catch (error: any) {
      this.logger.error('❌ UMH-Core connection error', { error: error.message });
      this.addError(`UMH-Core connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from UMH-Core
   */
  private async disconnectUMH(): Promise<void> {
    if (this.umhClient) {
      await this.umhClient.disconnect();
      this.logger.info('🔌 Disconnected from UMH-Core');
    }
  }

  /**
   * Start publishing sensor data
   */
  private startPublishing(): void {
    this.publishTimer = setInterval(() => {
      this.publishSensorData();
    }, this.config.publishInterval);

    this.logger.info('📊 Started publishing sensor data to UMH-Core', {
      interval: this.config.publishInterval + 'ms',
      batchSize: this.config.batchSize || 1
    });
  }

  /**
   * Publish sensor data for all machines
   */
  private async publishSensorData(): Promise<void> {
    if (!this.umhClient || !this.isRunning) {
      return;
    }

    try {
      // Generate readings for operational machines only
      const allReadings = this.dataFactory.generateOperationalReadings();
      const umhMessages: any[] = [];

      allReadings.forEach((readings: SensorReading[], machineId: string) => {
        // Find the machine configuration
        const machine = CNC_MACHINES.find(m => m.machine_id === machineId);
        if (!machine) {
          this.logger.warn('⚠️ Machine configuration not found', { machineId });
          return;
        }

        readings.forEach((reading: SensorReading) => {
          const sensorType = UMHAdapter.extractSensorType(reading.topicPath);
          const readingWithMachine: SensorReadingWithMachine = {
            ...reading,
            machine,
            sensorType
          };

          const umhMessage = UMHAdapter.convertToUMHMessage(readingWithMachine);
          
          // Validate UMH message format
          const validation = UMHAdapter.validateUMHMessage(umhMessage);
          if (!validation.valid) {
            this.logger.warn('⚠️ Invalid UMH message format', {
              machineId,
              sensorType,
              errors: validation.errors
            });
            return;
          }

          umhMessages.push(umhMessage);
        });
      });

      // Publish messages (batch or individual)
      if (umhMessages.length > 0) {
        const batchSize = this.config.batchSize || 1;
        
        if (batchSize > 1 && umhMessages.length > batchSize) {
          // Send in batches
          for (let i = 0; i < umhMessages.length; i += batchSize) {
            const batch = umhMessages.slice(i, i + batchSize);
            await this.umhClient.publishBatch(batch);
            this.metrics.batchesSent++;
            this.metrics.totalMessagesPublished += batch.length;
          }
        } else {
          // Send individual messages
          for (const message of umhMessages) {
            await this.umhClient.publish(message);
            this.metrics.totalMessagesPublished++;
          }
        }
      }

      // Update metrics
      this.metrics.activeMachines = allReadings.size;
      this.updateMetrics();

      this.logger.debug('📤 Published sensor data to UMH-Core', {
        machines: allReadings.size,
        messages: umhMessages.length,
        batches: this.metrics.batchesSent,
        total: this.metrics.totalMessagesPublished
      });

    } catch (error: any) {
      this.logger.error('❌ Error during UMH sensor data publishing', {
        error: error.message
      });
      this.addError(`UMH publishing error: ${error.message}`);
    }
  }

  /**
   * Update simulation metrics
   */
  private updateMetrics(): void {
    const now = Date.now();
    const uptimeSeconds = (now - this.startTime.getTime()) / 1000;
    
    this.metrics.uptime = Math.round(uptimeSeconds);
    this.metrics.messagesPerSecond = uptimeSeconds > 0 
      ? Math.round((this.metrics.totalMessagesPublished / uptimeSeconds) * 100) / 100 
      : 0;
  }

  /**
   * Add error to metrics
   */
  private addError(error: string): void {
    this.metrics.errors.push(error);
    
    // Keep only last 10 errors
    if (this.metrics.errors.length > 10) {
      this.metrics.errors = this.metrics.errors.slice(-10);
    }
  }

  /**
   * Get current simulation metrics
   */
  getMetrics(): SimulationMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = null;
    }
    
    await this.disconnectUMH();
    this.isRunning = false;
  }
}

export default UMHSimulationManager;