/**
 * UMH MQTT Adapter
 * Converts CNC sensor readings to UMH-compatible MQTT format
 * Follows UMH topic convention: uns-demo/{level1}/{level2}/{level3}/{machine_id}/info/sensors/{sensor_type}
 * Payload format: {"timestamp_ms": number, "value": number|string|boolean}
 */

import { SensorReading } from './cnc-data-generator';

export interface UMHMQTTMessage {
  topic: string;
  payload: {
    timestamp_ms: number;
    value: number | string | boolean;
  };
}

export interface SensorReadingWithMachine extends SensorReading {
  machineId: string;
  machineType: string;
}

/**
 * Converts CNC sensor readings to UMH-compatible MQTT messages
 * Following UMH's "one tag, one message, one topic" principle
 */
export class UMHMQTTAdapter {
  private readonly locationHierarchy: {
    level1: string;
    level2: string;
    level3: string;
  };

  constructor(
    enterprise = 'demo-factory',
    site = 'plant-a', 
    area = 'production-floor'
  ) {
    this.locationHierarchy = {
      level1: enterprise,
      level2: site, 
      level3: area
    };
  }

  /**
   * Convert sensor reading to UMH MQTT messages
   * Each sensor type becomes a separate MQTT message
   */
  convertSensorReading(reading: SensorReadingWithMachine): UMHMQTTMessage[] {
    const messages: UMHMQTTMessage[] = [];
    const timestamp_ms = reading.timestamp.getTime();

    // Create separate messages for each sensor value following UMH's one-tag-one-message principle
    const sensorMappings = [
      { sensor: 'spindle_speed', value: reading.spindleSpeed, unit: 'rpm' },
      { sensor: 'feed_rate', value: reading.feedRate, unit: 'mm_min' },
      { sensor: 'tool_wear', value: reading.toolWear, unit: 'percent' },
      { sensor: 'vibration_x', value: reading.vibration.x, unit: 'mm_s' },
      { sensor: 'vibration_y', value: reading.vibration.y, unit: 'mm_s' },
      { sensor: 'vibration_z', value: reading.vibration.z, unit: 'mm_s' },
      { sensor: 'temperature', value: reading.temperature, unit: 'celsius' },
      { sensor: 'power_consumption', value: reading.powerConsumption, unit: 'watts' },
      { sensor: 'operational_state', value: reading.operationalState, unit: 'state' }
    ];

    // Create separate MQTT message for each sensor following UMH pattern
    sensorMappings.forEach(({ sensor, value }) => {
      const topic = this.buildUMHTopic(reading.machineId, sensor);
      
      messages.push({
        topic,
        payload: {
          timestamp_ms,
          value: value
        }
      });
    });

    return messages;
  }

  /**
   * Build UMH-compliant topic following the pattern:
   * uns-demo/{level1}/{level2}/{level3}/{machine_id}/info/sensors/{sensor_type}
   * 
   * This matches the topic pattern UMH is configured to consume:
   * uns-demo/+/+/+/+/info/sensors/+
   */
  private buildUMHTopic(machineId: string, sensorType: string): string {
    const { level1, level2, level3 } = this.locationHierarchy;
    
    return `uns-demo/${level1}/${level2}/${level3}/${machineId}/info/sensors/${sensorType}`;
  }

  /**
   * Create UMH status message for machine operational state
   */
  convertStatusReading(reading: SensorReadingWithMachine): UMHMQTTMessage {
    const timestamp_ms = reading.timestamp.getTime();
    const topic = `uns-demo/${this.locationHierarchy.level1}/${this.locationHierarchy.level2}/${this.locationHierarchy.level3}/${reading.machineId}/info/status/operational_state`;
    
    return {
      topic,
      payload: {
        timestamp_ms,
        value: reading.operationalState
      }
    };
  }

  /**
   * Create UMH production message for cycle count and job info
   */
  convertProductionReading(reading: SensorReadingWithMachine): UMHMQTTMessage[] {
    const messages: UMHMQTTMessage[] = [];
    const timestamp_ms = reading.timestamp.getTime();
    const baseTopicPath = `uns-demo/${this.locationHierarchy.level1}/${this.locationHierarchy.level2}/${this.locationHierarchy.level3}/${reading.machineId}/info/production`;

    // Cycle count message
    messages.push({
      topic: `${baseTopicPath}/cycle_count`,
      payload: {
        timestamp_ms,
        value: reading.cycleCount || 0
      }
    });

    // Current program/job message  
    if (reading.currentProgram) {
      messages.push({
        topic: `${baseTopicPath}/current_program`,
        payload: {
          timestamp_ms,
          value: reading.currentProgram
        }
      });
    }

    return messages;
  }

  /**
   * Convert all sensor data into UMH-compliant MQTT messages
   * Returns array of messages following UMH's one-tag-one-message principle
   */
  convertToUMHMessages(reading: SensorReadingWithMachine): UMHMQTTMessage[] {
    const messages: UMHMQTTMessage[] = [];
    
    // Add sensor readings (multiple messages)
    messages.push(...this.convertSensorReading(reading));
    
    // Add status message
    messages.push(this.convertStatusReading(reading));
    
    // Add production messages
    messages.push(...this.convertProductionReading(reading));
    
    return messages;
  }
}