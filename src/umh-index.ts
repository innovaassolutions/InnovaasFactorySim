#!/usr/bin/env node

/**
 * UMH-Core Direct Integration CNC Machine Simulator
 * Generates realistic CNC machine data and publishes directly to UMH-Core
 */

import { UMHSimulationManager } from './umh-simulation-service';
import pino from 'pino';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logger = pino({
  name: 'umh-cnc-simulator-main',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

async function startUMHCNCSimulator() {
  logger.info('🏭 Starting UMH-Core Direct Integration CNC Machine Simulator...');
  
  // Configuration for the UMH simulation
  const simulationConfig = {
    umhCoreUrl: process.env.UMH_CORE_URL || 'http://umh-core:8090',
    publishInterval: parseInt(process.env.PUBLISH_INTERVAL || '3000'), // 3 seconds default
    enableLogging: process.env.ENABLE_LOGGING !== 'false', // true by default
    outputFormat: 'umh' as const, // Only UMH format for direct integration
    batchSize: parseInt(process.env.BATCH_SIZE || '10'), // Batch messages for efficiency
  };

  logger.info('📊 UMH Simulation Configuration:', {
    umhCoreUrl: simulationConfig.umhCoreUrl,
    publishInterval: simulationConfig.publishInterval,
    outputFormat: simulationConfig.outputFormat,
    batchSize: simulationConfig.batchSize,
    enableLogging: simulationConfig.enableLogging
  });

  try {
    // Start the UMH simulation
    await UMHSimulationManager.startSimulation(simulationConfig);
    
    logger.info('✅ UMH CNC Simulator started successfully!');
    logger.info('🚀 10 CNC machines are now generating sensor data every 3 seconds');
    logger.info('📡 Publishing directly to UMH-Core Unified Namespace via HTTP API');
    
    // Display metrics every 30 seconds
    const metricsInterval = setInterval(() => {
      const metrics = UMHSimulationManager.getMetrics();
      if (metrics) {
        logger.info('📈 UMH Simulation Metrics:', {
          totalMessages: metrics.totalMessagesPublished,
          messagesPerSecond: metrics.messagesPerSecond,
          activeMachines: metrics.activeMachines,
          batchesSent: metrics.batchesSent,
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
      logger.info('🛑 Shutting down UMH CNC simulator...');
      clearInterval(metricsInterval);
      await UMHSimulationManager.stopSimulation();
      logger.info('✅ UMH CNC simulator stopped');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Display initial status after a few seconds
    setTimeout(() => {
      const metrics = UMHSimulationManager.getMetrics();
      if (metrics) {
        logger.info('🎯 Initial UMH Status:', {
          activeMachines: metrics.activeMachines,
          totalMessages: metrics.totalMessagesPublished,
          batchesSent: metrics.batchesSent,
          uptime: `${metrics.uptime}s`
        });
      }
    }, 5000);
    
  } catch (error: any) {
    logger.error('❌ Failed to start UMH CNC simulator:', { 
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

// Start the UMH simulator
if (require.main === module) {
  startUMHCNCSimulator().catch((error) => {
    logger.error('💥 Unexpected error starting UMH simulator:', { error });
    process.exit(1);
  });
}