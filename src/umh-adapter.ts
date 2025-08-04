/**
 * UMH Core Adapter
 * Converts CNC sensor readings to UMH Core compatible format
 */

import { MQTTPayload } from './types/uns-types';
import { UMHMessage, UMHPayload, UMHMetadata, buildUMHTopic, buildLocationPath, UMH_DATA_CONTRACTS } from './types/umh-types';
import { CNCMachineConfig } from './cnc-data-generator';

export interface SensorReadingWithMachine {
  topicPath: string;
  payload: MQTTPayload;
  machine: CNCMachineConfig;
  sensorType: string;
}

export class UMHAdapter {
  
  /**
   * Convert UNS sensor reading to UMH Core compatible message
   */
  static convertToUMHMessage(reading: SensorReadingWithMachine): UMHMessage {
    const { payload, machine, sensorType } = reading;
    
    // Extract timestamp as milliseconds
    const timestamp_ms = new Date(payload.timestamp).getTime();
    
    // Build UMH Core compatible payload (simplified to core requirements)
    const umhPayload: UMHPayload = {
      value: payload.value,
      timestamp_ms: timestamp_ms
    };
    
    // Build location path
    const location_path = buildLocationPath(
      machine.enterprise,
      machine.site,
      machine.area,
      machine.work_cell,
      machine.machine_id
    );
    
    // Create tag name from sensor type (convert from kebab-case to snake_case for UMH)
    const tag_name = sensorType.replace(/-/g, '_');
    
    // Build UMH metadata
    const umhMetadata: UMHMetadata = {
      location_path: location_path,
      data_contract: UMH_DATA_CONTRACTS.RAW, // Use _raw contract for initial compatibility
      tag_name: tag_name,
      // Optional fields from original payload
      unit: payload.unit,
      quality: payload.quality,
      source: payload.source,
      // Include original metadata for debugging/troubleshooting
      original_metadata: payload.metadata
    };
    
    // Build UMH Core topic
    const topic = buildUMHTopic({
      enterprise: machine.enterprise,
      site: machine.site,
      area: machine.area,
      work_cell: machine.work_cell,
      machine: machine.machine_id,
      data_contract: UMH_DATA_CONTRACTS.RAW,
      tag_name: tag_name
    });
    
    return {
      payload: umhPayload,
      metadata: umhMetadata,
      topic: topic
    };
  }
  
  /**
   * Convert multiple sensor readings to UMH messages
   */
  static convertMultipleReadings(readings: SensorReadingWithMachine[]): UMHMessage[] {
    return readings.map(reading => this.convertToUMHMessage(reading));
  }
  
  /**
   * Extract sensor type from topic path
   * Example: "uns-demo/factory-floor/machining/cell-01/cnc-001/info/sensors/spindle-speed" → "spindle-speed"
   */
  static extractSensorType(topicPath: string): string {
    const parts = topicPath.split('/');
    return parts[parts.length - 1];
  }
  
  /**
   * Validate UMH message format
   */
  static validateUMHMessage(message: UMHMessage): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate payload
    if (!message.payload) {
      errors.push('Missing payload');
    } else {
      if (message.payload.value === undefined || message.payload.value === null) {
        errors.push('Payload missing value');
      }
      if (!message.payload.timestamp_ms || typeof message.payload.timestamp_ms !== 'number') {
        errors.push('Payload missing or invalid timestamp_ms');
      }
    }
    
    // Validate metadata
    if (!message.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!message.metadata.location_path) {
        errors.push('Metadata missing location_path');
      }
      if (!message.metadata.data_contract) {
        errors.push('Metadata missing data_contract');
      }
      if (!message.metadata.tag_name) {
        errors.push('Metadata missing tag_name');
      }
    }
    
    // Validate topic
    if (!message.topic) {
      errors.push('Missing topic');
    } else if (!message.topic.startsWith('umh.v1.')) {
      errors.push('Topic does not start with umh.v1.');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

export default UMHAdapter;