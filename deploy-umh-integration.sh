#!/bin/bash

# UMH Integration Deployment Script
# Deploys UMH-Core with CNC Simulator and TimescaleDB

set -e  # Exit on any error

echo "🚀 UMH Integration Deployment Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_status "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi
print_success "Docker is available"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi
print_success "Docker Compose is available"

if ! docker info &> /dev/null; then
    print_error "Docker is not running"
    exit 1
fi
print_success "Docker is running"

# Check if compose file exists
if [ ! -f "docker-compose.umh-integration.yml" ]; then
    print_error "docker-compose.umh-integration.yml not found"
    exit 1
fi
print_success "Docker Compose file found"

# Stop any existing services
print_status "🛑 Stopping any existing services..."
docker-compose -f docker-compose.umh-integration.yml down --remove-orphans || true

# Build the CNC Simulator image
print_status "🏗️  Building CNC Simulator image..."
docker-compose -f docker-compose.umh-integration.yml build cnc-simulator
print_success "CNC Simulator image built"

# Start all services
print_status "🚀 Starting UMH integration services..."
docker-compose -f docker-compose.umh-integration.yml up -d

# Wait for services to start
print_status "⏳ Waiting for services to start..."
sleep 15

# Check service status
print_status "📊 Checking service status..."
docker-compose -f docker-compose.umh-integration.yml ps

echo ""
print_status "📊 UMH Integration Services:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${CYAN}🏭 UMH Core:${NC}"
echo "   • API: http://157.245.48.132:8090"
echo "   • Kafka: 157.245.48.132:9092"
echo "   • Topic Browser: http://157.245.48.132:8091"

echo -e "\n${CYAN}🗄️  TimescaleDB:${NC}"
echo "   • Host: 157.245.48.132:5432"
echo "   • Database: uns_production"
echo "   • User: uns_admin"

echo -e "\n${CYAN}🏭 CNC Simulator:${NC}"
echo "   • Status: Publishing to UMH-Core via HTTP API"
echo "   • Machines: 10 simulated CNC machines"
echo "   • Interval: 5 seconds"

echo -e "\n${CYAN}🐳 Portainer:${NC}"
echo "   • URL: http://157.245.48.132:9000"
echo "   • Purpose: Container management UI"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
echo "   • View logs: docker-compose -f docker-compose.umh-integration.yml logs -f"
echo "   • Stop services: docker-compose -f docker-compose.umh-integration.yml down"
echo "   • Restart services: docker-compose -f docker-compose.umh-integration.yml restart"
echo "   • SSH to server: ssh -i ~/.ssh/digitalocean root@157.245.48.132"

print_success "UMH Integration deployment completed successfully!"
echo -e "${GREEN}🌟 The system is now ready for data ingestion and processing.${NC}"