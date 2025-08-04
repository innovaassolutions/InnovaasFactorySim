# CNC Factory Simulator 

[![Docker Build](https://img.shields.io/badge/docker-build-success.svg)](https://github.com/innovaassolutions/InnovaasFactorySim)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![MQTT](https://img.shields.io/badge/MQTT-5.0-orange.svg)](https://mqtt.org/)

A comprehensive factory simulation system that generates realistic CNC machine sensor data for industrial IoT applications, predictive maintenance, and Unified Namespace (UNS) demonstrations. This simulator produces high-fidelity operational data from 10 different CNC machines with varied operational states and publishes to MQTT with ISA-95 compliant topic structures.

## 🏭 Purpose & Function

### Industrial IoT Demonstration Platform

This simulator serves as the foundation for demonstrating modern Industry 4.0 concepts including:

- **Unified Namespace (UNS)** - ISA-95 compliant hierarchical data organization
- **Real-time Data Streaming** - MQTT-based sensor data publication
- **Predictive Maintenance** - Machine learning training data generation
- **Digital Twin Architecture** - Virtual representation of physical factory floor
- **Edge-to-Cloud Integration** - Seamless data flow from factory floor to enterprise systems

### Key Business Use Cases

1. **Manufacturing Operations Centers** - Real-time visibility into factory floor performance
2. **Predictive Maintenance Systems** - Historical and real-time data for failure prediction
3. **Production Planning & Scheduling** - Live machine status for optimal scheduling
4. **Quality Management** - Process parameter monitoring and correlation analysis
5. **Energy Management** - Power consumption tracking and optimization
6. **Asset Performance Management** - OEE calculation and improvement tracking

## 🎯 Core Features

### 🏭 Realistic Factory Environment
- **10 Authentic CNC Machines** - Mills, lathes, and multi-axis machines from major manufacturers
- **Industrial Brands Represented** - Haas, DMG Mori, Mazak, Okuma, Doosan, Fanuc, Mori Seiki
- **Operational Complexity** - Full production cycle simulation with realistic timing
- **Multi-Area Layout** - Machining, turning, multi-axis, and precision work areas

### 📊 Comprehensive Sensor Data
- **15+ Sensor Types** - Complete machine instrumentation simulation
- **Motion Control Data** - Spindle speeds, axis positions, feedrates
- **Environmental Monitoring** - Vibration, temperature, coolant systems
- **Production Metrics** - Parts count, cycle times, efficiency calculations
- **Tool Management** - Tool wear tracking and change notifications

### 🔄 Advanced State Management
- **6 Operational States** - Idle, loading, machining, unloading, maintenance, error
- **Realistic Transitions** - Probabilistic state changes based on industrial patterns
- **Maintenance Scheduling** - Planned and unplanned maintenance simulation
- **Error Conditions** - Fault injection and recovery scenarios

### 🌐 Industrial Protocol Support
- **MQTT 5.0 Compliance** - Modern IoT messaging with QoS guarantees
- **UNS Topic Structure** - ISA-95 hierarchical naming conventions
- **UMH Core Integration** - Native support for United Manufacturing Hub
- **Multi-Format Output** - Flexible payload formats for different systems

## 🚀 Quick Start Guide

### Prerequisites

#### For UMH Core Integration (Recommended)
- **UMH Core** - Industrial IoT platform with built-in message broker
- **Docker** - For containerized deployment
- **Node.js 20+** (optional) - For local development

#### For Standalone Deployment
- **Node.js 20+** - JavaScript runtime environment
- **External MQTT Broker** - HiveMQ, Eclipse Mosquitto, or cloud broker
- **Docker** (optional) - For containerized deployment

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/innovaassolutions/InnovaasFactorySim.git
   cd InnovaasFactorySim
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MQTT broker settings
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Start Simulation**
   ```bash
   npm start
   ```

### Docker Deployment

#### With UMH Core Integration (Recommended)
```bash
# Build image
docker build -t cnc-factory-sim:latest .

# Connect to UMH Core (with built-in message broker)
docker run -d \
  --name cnc-factory-sim \
  --network umh-network \
  -e MQTT_BROKER_URL=mqtt://umh-core:1883 \
  -e OUTPUT_FORMAT=umh \
  cnc-factory-sim:latest

# Or connect to external UMH Core instance
docker run -d \
  --name cnc-factory-sim \
  -e MQTT_BROKER_URL=mqtt://your-umh-core-host:1883 \
  -e OUTPUT_FORMAT=umh \
  cnc-factory-sim:latest
```

#### Standalone with External MQTT Broker
```bash
# Run with external MQTT broker (HiveMQ, Mosquitto, etc.)
docker run -d \
  --name cnc-factory-sim \
  -e MQTT_BROKER_URL=mqtt://your-broker:1883 \
  -e MQTT_USERNAME=your-username \
  -e MQTT_PASSWORD=your-password \
  -e OUTPUT_FORMAT=uns \
  cnc-factory-sim:latest
```

#### Docker Compose (Development)
```bash
# Start complete simulation environment
docker-compose up -d

# View logs
docker-compose logs -f cnc-simulator

# Stop simulation
docker-compose down
```

## ⚙️ Configuration Reference

### Environment Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `MQTT_BROKER_URL` | `mqtt://localhost:1883` | MQTT broker connection | `mqtt://umh-core:1883` (UMH) or `mqtt://broker.hivemq.com:1883` (standalone) |
| `MQTT_USERNAME` | - | MQTT authentication username | `factory_user` |
| `MQTT_PASSWORD` | - | MQTT authentication password | `secure_password` |
| `PUBLISH_INTERVAL` | `3000` | Data publishing interval (ms) | `1000` for 1-second intervals |
| `ENABLE_LOGGING` | `true` | Detailed operation logging | `false` for production |
| `OUTPUT_FORMAT` | `uns` | Data format selection | `umh` (for UMH Core), `uns` (standalone), or `both` |
| `FACTORY_NAME` | `acme` | Enterprise identifier | `your-company` |
| `SITE_NAME` | `plant1` | Site/plant identifier | `factory-north` |

### MQTT Topic Architectures

#### UNS Format (ISA-95 Compliant)
```
{enterprise}/{site}/{area}/{work_cell}/{machine_id}/info/sensors/{sensor_type}
```

**Real Examples:**
```
acme/plant1/machining/cell-01/cnc-001/info/sensors/spindle_speed
acme/plant1/turning/cell-02/cnc-003/info/sensors/vibration
acme/plant1/multi-axis/cell-03/cnc-005/info/sensors/temperature
```

#### UMH Core Format (Unified Manufacturing Hub)
```
umh/v1/{enterprise}/{site}/{area}/{work_cell}/{machine}/_raw/{sensor_type}
```

**Real Examples:**
```
umh/v1/acme/plant1/machining/cnc-mill-001/_raw/spindle_speed
umh/v1/acme/plant1/turning/cnc-lathe-002/_raw/vibration
umh/v1/acme/plant1/multi-axis/cnc-multi-003/_raw/temperature
```

## 🏭 Factory Floor Layout

### Production Areas & Machines

#### Machining Center (High-Volume Production)
- **cnc-001** - Haas VF-2 Mill #1 (3-axis, operational)
- **cnc-002** - Haas VF-2 Mill #2 (3-axis, operational) 
- **cnc-008** - Doosan DNM 500 (3-axis, operational)

#### Turning Center (Rotational Parts)
- **cnc-003** - DMG Mori NLX2500 Lathe #1 (2-axis, operational)
- **cnc-004** - DMG Mori NLX2500 Lathe #2 (2-axis, operational)
- **cnc-007** - Okuma Genos L250-E (2-axis, operational)

#### Multi-Axis Complex (Advanced Manufacturing)
- **cnc-005** - Mazak Integrex i-300 #1 (5-axis, operational)
- **cnc-006** - Mazak Integrex i-300 #2 (5-axis, maintenance)

#### Precision Center (High-Accuracy Work)
- **cnc-009** - Fanuc Robodrill α-T14iE (3-axis, operational)
- **cnc-010** - Mori Seiki NV5000 DCG (5-axis, offline)

### Machine Specifications

| Machine | Type | Axes | Max Spindle | Tool Changer | Coolant | Work Envelope |
|---------|------|------|-------------|--------------|---------|---------------|
| Haas VF-2 | Mill | XYZ | 8,100 RPM | 20-tool ATC | Flood | 30"×16"×20" |
| DMG Mori NLX2500 | Lathe | XZ | 4,000 RPM | 12-tool turret | Flood/Mist | Ø10" × 20" |
| Mazak Integrex i-300 | Turn-Mill | XYZ+BC | 6,000 RPM | 40-tool ATC | High-pressure | Ø12" × 24" |
| Okuma Genos L250-E | Lathe | XZ | 5,000 RPM | 12-tool turret | Flood | Ø8" × 16" |
| Doosan DNM 500 | Mill | XYZ | 12,000 RPM | 24-tool ATC | Flood | 24"×16"×18" |
| Fanuc Robodrill | Mill | XYZ | 24,000 RPM | 21-tool ATC | Oil-mist | 16"×12"×10" |

## 📊 Sensor Data Specification

### Motion Control Sensors
- **Spindle Speed** (0-24,000 RPM) - Variable based on operation and material
- **Spindle Load** (0-100%) - Cutting force feedback with tool wear simulation
- **Axis Positions** (mm/degrees) - Real-time position feedback for all axes
- **Feedrate** (0-5,000 mm/min) - Programmed vs actual feed rates
- **Rapid Traverse** (up to 30 m/min) - Non-cutting movement speeds

### Process Monitoring
- **Vibration** (0.1-50 mm/s RMS) - Machine health indicator with frequency analysis
- **Temperature** (20-85°C) - Spindle, motor, and ambient temperature monitoring
- **Power Consumption** (0.5-50 kW) - Real-time power draw with load correlation
- **Acoustic Emission** (40-120 dB) - Sound level monitoring for tool condition

### Fluid Systems
- **Coolant Pressure** (1-70 bar) - High-pressure coolant system monitoring
- **Coolant Flow Rate** (5-300 L/min) - Flow rate with clog detection
- **Coolant Temperature** (18-45°C) - Thermal management tracking
- **Oil Pressure** (2-8 bar) - Lubrication system health

### Production Tracking
- **Current Tool** (T01-T40) - Active tool with usage time tracking
- **Tool Wear** (0-100%) - Simulated wear progression with replacement alerts
- **Parts Count** (0-9999) - Shift and lifetime production counters
- **Cycle Time** (30s-45min) - Operation timing with efficiency calculations
- **Quality Metrics** (CPk 0.8-2.0) - Statistical process control simulation

### Operational Status
- **Machine State** - idle/setup/running/paused/alarm/maintenance
- **Program Status** - program_name, line_number, completion_percentage
- **Alarm Codes** - Industry-standard alarm simulation (Fanuc, Siemens, etc.)
- **Operator Messages** - Human-readable status and instruction messages

## 🔄 Operational Cycle Simulation

### State Machine Behavior

#### Normal Production Cycle
1. **Idle State** (2-5 minutes)
   - Spindle stopped, axes at home position
   - Operator loading next program or material
   - Power consumption: 2-5 kW baseline

2. **Setup/Loading State** (30-120 seconds)
   - Tool changes and program initialization
   - Work piece clamping and datum setting
   - Coolant system activation

3. **Machining State** (2-30 minutes)
   - Active cutting with full sensor simulation
   - Realistic load variations based on material
   - Progressive tool wear accumulation

4. **Unloading State** (15-60 seconds)
   - Part removal and quality inspection
   - Tool condition assessment
   - Work area cleaning

#### Maintenance & Error Scenarios
5. **Scheduled Maintenance** (15-180 minutes)
   - Preventive maintenance intervals (every 200-500 cycles)
   - Tool changes and calibration procedures
   - System diagnostics and adjustments

6. **Error/Alarm State** (5-60 minutes)
   - Random fault injection (tool breakage, probe failure, etc.)
   - Realistic recovery procedures
   - Error code generation and logging

### Probabilistic Transitions
- **Normal Operation**: 85% probability of successful cycle completion
- **Tool Changes**: Every 50-200 parts based on material and operation
- **Minor Alarms**: 5% chance per cycle (quick recovery)
- **Major Faults**: 0.5% chance per cycle (extended downtime)
- **Scheduled Maintenance**: Time-based intervals with usage correlation

## 🌐 Integration Architecture

### UMH Core Integration (Recommended)
```
┌─────────────────┐    ┌──────────────────────────────────┐    ┌─────────────────┐
│   CNC Factory   │ -> │           UMH Core               │ -> │  Time-Series    │
│   Simulator     │    │  ┌─────────────────────────────┐ │    │  Database       │
│                 │    │  │ MQTT Input → Embedded       │ │    │  (TimescaleDB)  │
│                 │    │  │ Redpanda → Stream Processor │ │    │                 │
└─────────────────┘    │  └─────────────────────────────┘ │    └─────────────────┘
                       └──────────────────────────────────┘                    │
┌─────────────────┐    ┌──────────────┐    ┌──────────────────────────────────┘
│   Enterprise    │ <- │  Dashboard   │ <- │
│   Systems       │    │  & Analytics │
│   (ERP/MES)     │    │              │
└─────────────────┘    └──────────────┘
```

### Standalone Integration (Alternative)
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   CNC Factory   │ -> │ External     │ -> │ Data Processing │
│   Simulator     │    │ MQTT Broker  │    │ (Custom/        │
│                 │    │ (HiveMQ/     │    │  Third-party)   │
└─────────────────┘    │  Mosquitto)  │    └─────────────────┘
                       └──────────────┘                    │
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┘
│   Enterprise    │ <- │  Dashboard   │ <- │
│   Systems       │    │  & Analytics │
│   (ERP/MES)     │    │              │
└─────────────────┘    └──────────────┘
```

### Supported Integration Patterns

#### UMH Core Integration (Built-in Message Broker)
- **Embedded Redpanda** - Internal Kafka-compatible message broker
- **MQTT Gateway** - Direct MQTT input processing
- **Benthos Stream Processors** - Real-time data transformation
- **UNS Topic Management** - Unified namespace handling
- **TimescaleDB Integration** - Optimized time-series storage
- **No External MQTT Broker Required** - Complete self-contained platform

#### Cloud Platform Integration
- **AWS IoT Core** - Direct MQTT ingestion with device shadows
- **Azure IoT Hub** - Device-to-cloud messaging with Azure Digital Twins
- **Google Cloud IoT** - Pub/Sub messaging with BigQuery analytics
- **HiveMQ Cloud** - Managed MQTT with enterprise features

#### Industrial Protocol Gateways
- **OPC UA Gateway** - Protocol bridging for legacy systems
- **Modbus TCP Bridge** - Serial protocol modernization
- **Ethernet/IP Adapter** - Allen-Bradley PLC integration
- **Profinet Connector** - Siemens ecosystem compatibility

## 🔧 Development & Customization

### Project Structure
```
cnc-simulator-standalone/
├── src/
│   ├── types/
│   │   ├── uns-types.ts          # UNS data type definitions
│   │   └── umh-types.ts          # UMH Core type definitions
│   ├── cnc-data-generator.ts     # Core simulation engine
│   ├── simulation-service.ts     # MQTT publishing service
│   ├── mqtt-client.ts           # MQTT connection management
│   ├── umh-adapter.ts           # UMH Core format adapter
│   └── index.ts                 # Application entry point
├── scripts/
│   └── start-umh-integration.ts  # UMH-specific startup script
├── Dockerfile                   # Container image definition
├── docker-compose.yml          # Development environment
├── docker-compose.production.yml # Production deployment
├── package.json                # Node.js package configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This documentation
```

### Adding New Machines

1. **Define Machine Configuration**
   ```typescript
   const newMachine: CNCMachine = {
     id: 'cnc-011',
     displayName: 'New Machine Model',
     type: 'mill',
     manufacturer: 'ManufacturerName',
     area: 'production-area',
     capabilities: {
       axes: ['X', 'Y', 'Z'],
       maxSpindleSpeed: 15000,
       toolCapacity: 30,
       hasCoolant: true
     }
   };
   ```

2. **Add to Machine Registry**
   ```typescript
   // In cnc-data-generator.ts
   export const MACHINE_CONFIGS = [
     // ... existing machines
     newMachine
   ];
   ```

### Custom Sensor Development

1. **Define Sensor Type**
   ```typescript
   interface CustomSensor {
     name: string;
     unit: string;
     range: { min: number; max: number };
     updateFrequency: number;
     calculator: (machine: CNCMachine, state: OperationalState) => number;
   }
   ```

2. **Implement Sensor Logic**
   ```typescript
   const customSensor: CustomSensor = {
     name: 'custom_parameter',
     unit: 'custom_unit',
     range: { min: 0, max: 100 },
     updateFrequency: 1000,
     calculator: (machine, state) => {
       // Your custom calculation logic
       return calculateCustomValue(machine, state);
     }
   };
   ```

### Build Commands

```bash
# Development workflow
npm install              # Install dependencies
npm run dev             # Start with auto-reload
npm run build           # Compile TypeScript
npm start               # Run production build

# Docker workflow
npm run docker:build    # Build container image
npm run docker:run      # Run containerized version
docker-compose up -d    # Full environment startup

# Testing & validation
npm test                # Run test suite (if implemented)
npm run lint            # Code quality checks
npm run type-check      # TypeScript validation
```

## 📈 Monitoring & Observability

### Real-Time Metrics
- **Message Throughput** - Messages per second with trend analysis
- **Connection Health** - MQTT broker connectivity and QoS metrics
- **Machine Utilization** - Individual and aggregate OEE calculations
- **Error Rates** - Fault frequency and mean time to recovery
- **Resource Usage** - CPU, memory, and network utilization

### Logging & Diagnostics
- **Structured Logging** - JSON format with correlation IDs
- **Performance Profiling** - Execution time and bottleneck identification
- **Connection Monitoring** - MQTT broker health and reconnection handling
- **Data Validation** - Sensor range checking and anomaly detection

### Health Checks
```bash
# Container health check endpoint
curl http://localhost:3000/health

# Detailed metrics endpoint
curl http://localhost:3000/metrics

# Machine status summary
curl http://localhost:3000/status
```

## 🔐 Security & Production Readiness

### MQTT Security
- **TLS/SSL Encryption** - Secure transport layer protection
- **Username/Password Authentication** - Basic credential-based access
- **Client Certificates** - X.509 certificate-based authentication
- **Topic-Level Authorization** - Granular publish/subscribe permissions

### Operational Security
- **Container Security** - Non-root user execution and minimal base image
- **Secrets Management** - Environment variable injection for credentials
- **Network Segmentation** - Factory network isolation best practices
- **Audit Logging** - Security event tracking and compliance reporting

### Production Deployment
- **Health Monitoring** - Kubernetes/Docker health check integration
- **Graceful Shutdown** - Clean resource cleanup and message acknowledgment
- **Error Recovery** - Automatic reconnection and state recovery
- **Resource Limits** - Memory and CPU constraints for stable operation

## 🚀 Deployment Scenarios

### Scenario 1: UMH Core Integration (Production Ready)
**Best for:** Industrial IoT platforms, predictive maintenance systems, digital factories

```bash
# Step 1: Ensure UMH Core is running
docker run -d --name umh-core \
  --network umh-network \
  unitedmanufacturinghub/umh-core:latest

# Step 2: Deploy CNC Simulator
docker run -d --name cnc-factory-sim \
  --network umh-network \
  -e MQTT_BROKER_URL=mqtt://umh-core:1883 \
  -e OUTPUT_FORMAT=umh \
  cnc-factory-sim:latest

# Result: Complete industrial IoT pipeline with built-in data processing
```

### Scenario 2: Standalone Development/Testing
**Best for:** Development, testing, custom integrations

```bash
# Step 1: Start external MQTT broker (if needed)
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto

# Step 2: Deploy CNC Simulator  
docker run -d --name cnc-factory-sim \
  -e MQTT_BROKER_URL=mqtt://localhost:1883 \
  -e OUTPUT_FORMAT=uns \
  cnc-factory-sim:latest

# Result: Flexible MQTT data stream for custom processing
```

### Scenario 3: Cloud Integration
**Best for:** Cloud-native applications, enterprise systems

```bash
# Connect to HiveMQ Cloud, AWS IoT Core, or Azure IoT Hub
docker run -d --name cnc-factory-sim \
  -e MQTT_BROKER_URL=mqtts://your-cloud-broker:8883 \
  -e MQTT_USERNAME=cloud-user \
  -e MQTT_PASSWORD=secure-token \
  -e OUTPUT_FORMAT=both \
  cnc-factory-sim:latest
```

## 📚 Use Cases & Examples

### UMH Core Predictive Maintenance
Complete industrial IoT demonstration with UMH Core:
```bash
# High-frequency data for ML training
docker run --network umh-network \
  -e MQTT_BROKER_URL=mqtt://umh-core:1883 \
  -e OUTPUT_FORMAT=umh \
  -e PUBLISH_INTERVAL=1000 \
  cnc-factory-sim:latest
```

### Digital Twin Development
Real-time factory floor representation:
```bash
# Mirror production environment with dual output
docker run -e OUTPUT_FORMAT=both \
  -e FACTORY_NAME=digital-twin \
  -e SITE_NAME=virtual-plant \
  cnc-factory-sim:latest
```

### Load Testing Infrastructure  
Stress test your industrial IoT platform:
```bash
# High-frequency data generation
docker run -e PUBLISH_INTERVAL=100 \
  -e OUTPUT_FORMAT=umh \
  cnc-factory-sim:latest
```

### Development & Integration Testing
Validate data processing pipelines:
```bash
# Controlled test environment
docker run -e MQTT_BROKER_URL=mqtt://test-broker:1883 \
  -e PUBLISH_INTERVAL=5000 \
  -e ENABLE_LOGGING=true \
  cnc-factory-sim:latest
```

## 🤝 Contributing

We welcome contributions to improve the CNC Factory Simulator! 

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with appropriate tests
4. Commit with descriptive messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Contribution Guidelines
- Follow existing code style and TypeScript conventions
- Add appropriate documentation for new features
- Include tests for new sensor types or machine configurations
- Update README.md for significant changes
- Ensure Docker builds succeed with your changes

### Issue Reporting
Please use GitHub Issues for:
- Bug reports with reproduction steps
- Feature requests with use case descriptions
- Documentation improvements
- Performance optimization suggestions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Industrial Partners** - Real-world factory floor insights and validation
- **Open Source Community** - MQTT, Node.js, and TypeScript ecosystem
- **Manufacturing Standards** - ISA-95, OPC UA, and Industry 4.0 working groups
- **Academic Research** - Predictive maintenance and digital twin publications

## 📞 Support & Contact

- **GitHub Issues** - Technical support and bug reports
- **Documentation** - Comprehensive guides and API reference
- **Community** - Join our discussions and share experiences
- **Professional Services** - Custom integration and consulting available

---

**Built with ❤️ for the Industrial IoT Community**

Transform your factory floor data strategy with realistic, production-ready simulation capabilities.