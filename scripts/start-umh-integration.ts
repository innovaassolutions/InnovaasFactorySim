#!/usr/bin/env node
/**
 * UMH Integration Startup Script
 * Deploys the complete UMH-Core + CNC Simulator + TimescaleDB stack
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit', shell: true });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', colors.yellow);
  
  // Check if Docker is running
  try {
    await runCommand('docker', ['version']);
    log('✅ Docker is running', colors.green);
  } catch (error) {
    log('❌ Docker is not running or not installed', colors.red);
    throw error;
  }
  
  // Check if docker-compose is available
  try {
    await runCommand('docker-compose', ['version']);
    log('✅ Docker Compose is available', colors.green);
  } catch (error) {
    log('❌ Docker Compose is not available', colors.red);
    throw error;
  }
  
  // Check if compose file exists
  if (!existsSync('./docker-compose.umh-integration.yml')) {
    log('❌ docker-compose.umh-integration.yml not found', colors.red);
    throw new Error('Docker Compose file not found');
  }
  log('✅ Docker Compose file found', colors.green);
}

async function buildImages() {
  log('\n🏗️  Building CNC Simulator image...', colors.yellow);
  
  try {
    await runCommand('docker-compose', [
      '-f', 'docker-compose.umh-integration.yml',
      'build', 'cnc-simulator'
    ]);
    log('✅ CNC Simulator image built successfully', colors.green);
  } catch (error) {
    log('❌ Failed to build CNC Simulator image', colors.red);
    throw error;
  }
}

async function startServices() {
  log('\n🚀 Starting UMH integration services...', colors.yellow);
  
  try {
    await runCommand('docker-compose', [
      '-f', 'docker-compose.umh-integration.yml',
      'up', '-d'
    ]);
    log('✅ Services started successfully', colors.green);
  } catch (error) {
    log('❌ Failed to start services', colors.red);
    throw error;
  }
}

async function waitForServices() {
  log('\n⏳ Waiting for services to be healthy...', colors.yellow);
  
  // Wait for services to start up
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  try {
    await runCommand('docker-compose', [
      '-f', 'docker-compose.umh-integration.yml',
      'ps'
    ]);
    log('✅ Service status checked', colors.green);
  } catch (error) {
    log('⚠️  Could not check service status', colors.yellow);
  }
}

async function showServiceInfo() {
  log('\n📊 UMH Integration Services:', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  
  log('🏭 UMH Core:', colors.cyan);
  log('   • API: http://localhost:8090', colors.reset);
  log('   • Kafka: localhost:9092', colors.reset);
  log('   • Topic Browser: http://localhost:8091', colors.reset);
  
  log('\n🗄️  TimescaleDB:', colors.cyan);
  log('   • Host: localhost:5432', colors.reset);
  log('   • Database: uns_production', colors.reset);
  log('   • User: uns_admin', colors.reset);
  
  log('\n🏭 CNC Simulator:', colors.cyan);
  log('   • Status: Publishing to UMH-Core via HTTP API', colors.reset);
  log('   • Machines: 10 simulated CNC machines', colors.reset);
  log('   • Interval: 5 seconds', colors.reset);
  
  log('\n🐳 Portainer:', colors.cyan);
  log('   • URL: http://localhost:9000', colors.reset);
  log('   • Purpose: Container management UI', colors.reset);
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  
  log('\n🔧 Useful Commands:', colors.bright);
  log('   • View logs: docker-compose -f docker-compose.umh-integration.yml logs -f', colors.reset);
  log('   • Stop services: docker-compose -f docker-compose.umh-integration.yml down', colors.reset);
  log('   • Restart services: docker-compose -f docker-compose.umh-integration.yml restart', colors.reset);
}

async function main() {
  try {
    log('🚀 UMH Integration Deployment Starting...', colors.bright);
    
    await checkPrerequisites();
    await buildImages();
    await startServices();
    await waitForServices();
    await showServiceInfo();
    
    log('\n✅ UMH Integration deployment completed successfully!', colors.green);
    log('🌟 The system is now ready for data ingestion and processing.', colors.green);
    
  } catch (error) {
    log('\n❌ Deployment failed:', colors.red);
    log(error instanceof Error ? error.message : String(error), colors.red);
    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  log('\n\n⚠️  Deployment interrupted by user', colors.yellow);
  process.exit(0);
});

main().catch((error) => {
  log('❌ Unexpected error:', colors.red);
  console.error(error);
  process.exit(1);
});