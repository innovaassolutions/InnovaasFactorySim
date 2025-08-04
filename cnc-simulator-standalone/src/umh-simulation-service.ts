/**
 * UMH-Compatible CNC Machine Simulation Service
 * Publishes sensor data in UMH-expected MQTT format
 */

import * as mqtt from 'mqtt';
import pino from 'pino';
import { CNCDataGeneratorFactory, SensorReading, CNC_MACHINES } from './cnc-data-generator';
import { UMHMQTTAdapter, SensorReadingWithMachine } from './umh-mqtt-adapter';

export interface UMHSimulationConfig {
  mqttBrokerUrl: string;
  mqttUsername?: string;
  mqttPassword?: string;
  simulationInterval: number;
  machineCount: number;
  logLevel: string;
}

/**
 * Manages CNC machine simulation with UMH-compatible MQTT publishing
 */
export class UMHSimulationManager {
  private mqttClient: mqtt.MqttClient | null = null;
  private generators: Map<string, any> = new Map();
  private umhAdapter: UMHMQTTAdapter;
  private logger: pino.Logger;
  private simulationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: UMHSimulationConfig;

  // Statistics
  private stats = {
    messagesPublished: 0,
    machinesActive: 0,
    lastPublishTime: new Date(),
    uptime: new Date(),
    errors: 0
  };

  constructor(config: UMHSimulationConfig) {
    this.config = config;
    this.logger = pino({
      name: 'umh-cnc-simulator',
      level: config.logLevel || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    });

    // Initialize UMH adapter with location hierarchy matching UMH config
    this.umhAdapter = new UMHMQTTAdapter('demo-factory', 'plant-a', 'production-floor');
    
    this.logger.info('🏭 UMH CNC Simulation Manager initialized');
  }

  /**
   * Start the simulation with MQTT connection
   */
  async start(): Promise<void> {
    try {
      this.logger.info('🚀 Starting UMH CNC simulation...');
      
      // Connect to MQTT broker
      await this.connectMQTT();
      
      // Initialize CNC machine generators
      this.initializeGenerators();
      
      // Start simulation loop
      this.startSimulationLoop();
      
      this.isRunning = true;
      this.stats.uptime = new Date();
      
      this.logger.info(`✅ UMH CNC simulation started with ${this.generators.size} machines`);
      
    } catch (error) {
      this.logger.error('❌ Failed to start UMH simulation:', error);
      throw error;
    }
  }

  /**
   * Stop the simulation
   */
  async stop(): Promise<void> {
    this.logger.info('🛑 Stopping UMH CNC simulation...');
    
    this.isRunning = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    if (this.mqttClient) {
      await this.mqttClient.endAsync();
      this.mqttClient = null;
    }
    
    this.logger.info('✅ UMH CNC simulation stopped');
  }

  /**
   * Connect to MQTT broker
   */
  private async connectMQTT(): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: mqtt.IClientOptions = {
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        keepalive: 60,
        clean: true,
        clientId: `umh-cnc-simulator-${Date.now()}`,
      };

      // Add authentication if provided
      if (this.config.mqttUsername && this.config.mqttPassword) {
        options.username = this.config.mqttUsername;
        options.password = this.config.mqttPassword;
      }

      this.logger.info(`🔌 Connecting to MQTT broker: ${this.config.mqttBrokerUrl}`);
      
      this.mqttClient = mqtt.connect(this.config.mqttBrokerUrl, options);

      this.mqttClient.on('connect', () => {
        this.logger.info('✅ Connected to MQTT broker');
        resolve();
      });

      this.mqttClient.on('error', (error) => {
        this.logger.error('❌ MQTT connection error:', error);
        this.stats.errors++;
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
   * Initialize CNC machine data generators
   */
  private initializeGenerators(): void {
    this.logger.info(`🏭 Initializing ${this.config.machineCount} CNC machine generators...`);
    
    // Get the first N machines from our predefined list
    const selectedMachines = CNC_MACHINES.slice(0, this.config.machineCount);
    
    selectedMachines.forEach((machineConfig) => {
      const generator = CNCDataGeneratorFactory.createGenerator(machineConfig);
      this.generators.set(machineConfig.id, {
        generator,
        config: machineConfig
      });
      
      this.logger.debug(`📊 Initialized generator for ${machineConfig.id} (${machineConfig.type})`);
    });
    
    this.stats.machinesActive = this.generators.size;
    this.logger.info(`✅ Initialized ${this.generators.size} CNC machine generators`);
  }

  /**
   * Start the simulation loop
   */
  private startSimulationLoop(): void {
    this.logger.info(`⏰ Starting simulation loop with ${this.config.simulationInterval}ms interval`);
    
    this.simulationInterval = setInterval(() => {
      this.publishAllMachineData();
    }, this.config.simulationInterval);
    
    // Also publish immediately on start
    this.publishAllMachineData();
  }

  /**
   * Publish data for all machines
   */
  private async publishAllMachineData(): Promise<void> {
    if (!this.mqttClient || !this.isRunning) {
      return;
    }

    const publishPromises: Promise<void>[] = [];

    // Generate and publish data for each machine
    this.generators.forEach((machineInfo, machineId) => {
      const { generator, config } = machineInfo;
      
      try {
        // Generate sensor reading
        const reading = generator.generateReading();
        
        // Add machine information to the reading
        const readingWithMachine: SensorReadingWithMachine = {
          ...reading,
          machineId: config.id,
          machineType: config.type
        };
        
        // Convert to UMH format and publish each message
        const umhMessages = this.umhAdapter.convertToUMHMessages(readingWithMachine);
        
        umhMessages.forEach((message) => {
          const publishPromise = this.publishMQTTMessage(message.topic, message.payload);
          publishPromises.push(publishPromise);
        });
        
      } catch (error) {
        this.logger.error(`❌ Error generating data for machine ${machineId}:`, error);
        this.stats.errors++;
      }
    });

    // Wait for all publications to complete
    try {
      await Promise.all(publishPromises);
      this.stats.lastPublishTime = new Date();
      
      // Log summary every 10 cycles (reduce log noise)
      if (this.stats.messagesPublished % (this.generators.size * 10) === 0) {
        this.logSimulationStats();
      }
      
    } catch (error) {
      this.logger.error('❌ Error publishing machine data:', error);
      this.stats.errors++;
    }
  }

  /**
   * Publish a single MQTT message
   */
  private async publishMQTTMessage(topic: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const messageStr = JSON.stringify(payload);
      
      this.mqttClient.publish(topic, messageStr, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`❌ Failed to publish to ${topic}:`, error);
          this.stats.errors++;
          reject(error);
        } else {
          this.stats.messagesPublished++;
          this.logger.debug(`📤 Published to ${topic}: ${messageStr}`);
          resolve();
        }
      });
    });
  }

  /**
   * Log simulation statistics
   */
  private logSimulationStats(): void {
    const uptime = Date.now() - this.stats.uptime.getTime();
    const uptimeMinutes = Math.round(uptime / 60000);
    
    this.logger.info('📈 UMH Simulation Metrics:', {
      messagesPublished: this.stats.messagesPublished,
      machinesActive: this.stats.machinesActive,
      errors: this.stats.errors,
      lastPublish: this.stats.lastPublishTime.toISOString(),
      uptimeMinutes: uptimeMinutes,
      mqttConnected: this.mqttClient?.connected || false
    });
  }

  /**
   * Get current simulation status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      machineCount: this.generators.size,
      mqttConnected: this.mqttClient?.connected || false
    };
  }
}