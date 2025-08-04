#!/usr/bin/env node

/**
 * Standalone CNC Machine Simulator
 * Generates realistic CNC machine data and publishes to MQTT for UNS Demo System
 */

import { SimulationManager } from './simulation-service';
import pino from 'pino';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logger = pino({
  name: 'cnc-simulator-main',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

async function startCNCSimulator() {
  logger.info('🏭 Starting Standalone CNC Machine Simulator...');
  
  // Configuration for the simulation
  const simulationConfig = {
    mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    mqttOptions: {
      // Use credentials if available, otherwise anonymous
      ...(process.env.MQTT_USERNAME && { username: process.env.MQTT_USERNAME }),
      ...(process.env.MQTT_PASSWORD && { password: process.env.MQTT_PASSWORD }),
      clientId: `cnc-simulator-${Date.now()}`,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
    },
    publishInterval: parseInt(process.env.PUBLISH_INTERVAL || '3000'), // 3 seconds default
    enableLogging: process.env.ENABLE_LOGGING !== 'false', // true by default
    outputFormat: (process.env.OUTPUT_FORMAT as 'uns' | 'umh' | 'both') || 'uns', // Default to UNS format
  };

  logger.info('📊 Simulation Configuration:', {
    brokerUrl: simulationConfig.mqttBrokerUrl,
    publishInterval: simulationConfig.publishInterval,
    outputFormat: simulationConfig.outputFormat,
    hasCredentials: !!(process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD),
    enableLogging: simulationConfig.enableLogging
  });

  try {
    // Start the simulation
    await SimulationManager.startSimulation(simulationConfig);
    
    logger.info('✅ CNC Simulator started successfully!');
    logger.info('🚀 10 CNC machines are now generating sensor data every 3 seconds');
    
    if (simulationConfig.outputFormat === 'uns') {
      logger.info('📡 Publishing to MQTT broker with UNS-compliant topic structure');
    } else if (simulationConfig.outputFormat === 'umh') {
      logger.info('📡 Publishing to MQTT broker with UMH Core-compatible format');
    } else {
      logger.info('📡 Publishing to MQTT broker with both UNS and UMH Core formats');
    }
    
    // Display metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      const metrics = SimulationManager.getMetrics();
      if (metrics) {
        logger.info('📈 Simulation Metrics:', {
          totalMessages: metrics.totalMessagesPublished,
          messagesPerSecond: metrics.messagesPerSecond,
          activeMachines: metrics.activeMachines,
          uptime: `${metrics.uptime}s`,
          errors: metrics.errors.length
        });
        
        if (metrics.errors.length > 0) {
          logger.warn('⚠️ Recent errors:', metrics.errors.slice(-3));
        }
      }
    }, 30000);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('🛑 Shutting down CNC simulator...');
      clearInterval(metricsInterval);
      await SimulationManager.stopSimulation();
      logger.info('✅ CNC simulator stopped');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Display initial status after a few seconds
    setTimeout(() => {
      const metrics = SimulationManager.getMetrics();
      if (metrics) {
        logger.info('🎯 Initial Status:', {
          activeMachines: metrics.activeMachines,
          totalMessages: metrics.totalMessagesPublished,
          uptime: `${metrics.uptime}s`
        });
      }
    }, 5000);
    
  } catch (error: any) {
    logger.error('❌ Failed to start CNC simulator:', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the simulator
if (require.main === module) {
  startCNCSimulator().catch((error) => {
    logger.error('💥 Unexpected error starting simulator:', { error });
    process.exit(1);
  });
}