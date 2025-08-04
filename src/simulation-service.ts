/**
 * CNC Machine Simulation Service
 * Manages the simulation lifecycle and MQTT publishing
 */

import * as mqtt from 'mqtt';
import pino from 'pino';
import { CNCDataGeneratorFactory, SensorReading, CNC_MACHINES } from './cnc-data-generator';
import { UMHAdapter, SensorReadingWithMachine } from './umh-adapter';

export interface SimulationConfig {
  mqttBrokerUrl: string;
  mqttOptions?: mqtt.IClientOptions;
  publishInterval: number; // milliseconds
  enableLogging?: boolean;
  outputFormat?: 'uns' | 'umh' | 'both'; // Support multiple output formats
}

export interface SimulationMetrics {
  totalMessagesPublished: number;
  messagesPerSecond: number;
  activeMachines: number;
  uptime: number; // seconds
  errors: string[];
}

export class SimulationManager {
  private static instance: SimulationManager | null = null;
  private mqttClient: mqtt.MqttClient | null = null;
  private dataFactory: CNCDataGeneratorFactory;
  private publishTimer: NodeJS.Timeout | null = null;
  private logger: pino.Logger;
  private config: SimulationConfig;
  private isRunning = false;
  private startTime: Date;
  private metrics: SimulationMetrics;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.dataFactory = new CNCDataGeneratorFactory();
    this.startTime = new Date();
    this.metrics = {
      totalMessagesPublished: 0,
      messagesPerSecond: 0,
      activeMachines: 0,
      uptime: 0,
      errors: []
    };

    // Initialize logger
    this.logger = pino({
      name: 'cnc-simulator',
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
  static async startSimulation(config: SimulationConfig): Promise<void> {
    if (SimulationManager.instance && SimulationManager.instance.isRunning) {
      throw new Error('Simulation is already running');
    }

    SimulationManager.instance = new SimulationManager(config);
    await SimulationManager.instance.start();
  }

  /**
   * Static method to stop simulation
   */
  static async stopSimulation(): Promise<void> {
    if (SimulationManager.instance) {
      await SimulationManager.instance.stop();
      SimulationManager.instance = null;
    }
  }

  /**
   * Static method to get metrics
   */
  static getMetrics(): SimulationMetrics | null {
    return SimulationManager.instance?.getMetrics() || null;
  }

  /**
   * Start the simulation
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Simulation is already running');
    }

    this.logger.info('🚀 Starting CNC Machine Simulation Service');
    
    try {
      // Connect to MQTT broker
      await this.connectMQTT();
      
      // Start publishing data
      this.startPublishing();
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.logger.info('✅ CNC simulation started successfully', {
        brokerUrl: this.config.mqttBrokerUrl,
        publishInterval: this.config.publishInterval,
        machines: this.dataFactory.getMachines().length
      });

    } catch (error: any) {
      this.logger.error('❌ Failed to start simulation', { error: error.message });
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

    this.logger.info('🛑 Stopping CNC simulation...');
    
    this.isRunning = false;
    
    // Stop publishing timer
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
      this.publishTimer = null;
    }

    // Disconnect MQTT client
    await this.disconnectMQTT();
    
    this.logger.info('✅ CNC simulation stopped');
  }

  /**
   * Connect to MQTT broker
   */
  private async connectMQTT(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info('🔌 Connecting to MQTT broker...', {
        url: this.config.mqttBrokerUrl
      });

      this.mqttClient = mqtt.connect(this.config.mqttBrokerUrl, {
        ...this.config.mqttOptions,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      this.mqttClient.on('connect', () => {
        this.logger.info('✅ Connected to MQTT broker');
        resolve();
      });

      this.mqttClient.on('error', (error) => {
        this.logger.error('❌ MQTT connection error', { error: error.message });
        this.addError(`MQTT connection error: ${error.message}`);
        reject(error);
      });

      this.mqttClient.on('disconnect', () => {
        this.logger.warn('⚠️ Disconnected from MQTT broker');
      });

      this.mqttClient.on('reconnect', () => {
        this.logger.info('🔄 Reconnecting to MQTT broker...');
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  private async disconnectMQTT(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mqttClient) {
        this.mqttClient.end(false, {}, () => {
          this.logger.info('🔌 Disconnected from MQTT broker');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Start publishing sensor data
   */
  private startPublishing(): void {
    this.publishTimer = setInterval(() => {
      this.publishSensorData();
    }, this.config.publishInterval);

    this.logger.info('📊 Started publishing sensor data', {
      interval: this.config.publishInterval + 'ms'
    });
  }

  /**
   * Publish sensor data for all machines
   */
  private publishSensorData(): void {
    if (!this.mqttClient || !this.isRunning) {
      return;
    }

    try {
      // Generate readings for operational machines only
      const allReadings = this.dataFactory.generateOperationalReadings();
      let publishedCount = 0;
      const outputFormat = this.config.outputFormat || 'uns';

      allReadings.forEach((readings: SensorReading[], machineId: string) => {
        // Find the machine configuration
        const machine = CNC_MACHINES.find(m => m.machine_id === machineId);
        if (!machine) {
          this.logger.warn('⚠️ Machine configuration not found', { machineId });
          return;
        }

        readings.forEach((reading: SensorReading) => {
          // Publish in UNS format (original)
          if (outputFormat === 'uns' || outputFormat === 'both') {
            this.publishMessage(reading.topicPath, reading.payload, publishedCount);
          }

          // Publish in UMH Core format
          if (outputFormat === 'umh' || outputFormat === 'both') {
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

            this.publishMessage(umhMessage.topic, umhMessage.payload, publishedCount);
          }
        });
      });

      // Update metrics
      this.metrics.activeMachines = allReadings.size;
      this.updateMetrics();

      this.logger.debug('📤 Published sensor data', {
        machines: allReadings.size,
        messages: publishedCount,
        format: outputFormat,
        total: this.metrics.totalMessagesPublished
      });

    } catch (error: any) {
      this.logger.error('❌ Error during sensor data publishing', {
        error: error.message
      });
      this.addError(`Publishing error: ${error.message}`);
    }
  }

  /**
   * Helper method to publish a single message
   */
  private publishMessage(topic: string, payload: any, publishedCount: number): void {
    const message = JSON.stringify(payload);
    
    this.mqttClient!.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        this.logger.error('❌ Failed to publish message', {
          topic: topic,
          error: error.message
        });
        this.addError(`Publish error for ${topic}: ${error.message}`);
      } else {
        publishedCount++;
        this.metrics.totalMessagesPublished++;
      }
    });
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
    
    await this.disconnectMQTT();
    this.isRunning = false;
  }
}

export default SimulationManager;