// UNS (Unified Namespace) Type Definitions

export type UNSLayer = 'descriptive' | 'functional' | 'informational' | 'ad_hoc';

export type DataType = 'number' | 'string' | 'boolean' | 'object';

export type OperationalStatus = 'operational' | 'maintenance' | 'offline' | 'error' | 'running' | 'setup' | 'idle';

// MQTT Message Payload Schema
export interface MQTTPayload {
  timestamp: string; // ISO 8601 format
  source: string;
  value: any;
  unit?: string;
  quality?: 'good' | 'bad' | 'uncertain';
  metadata?: Record<string, any>;
}

// Standard Units Enumeration
export enum StandardUnits {
  // Temperature
  CELSIUS = 'celsius',
  FAHRENHEIT = 'fahrenheit',
  KELVIN = 'kelvin',
  
  // Pressure
  BAR = 'bar',
  PSI = 'psi',
  PASCAL = 'Pa',
  
  // Speed/Frequency
  RPM = 'rpm',
  HERTZ = 'Hz',
  
  // Power
  KILOWATT = 'kW',
  HORSEPOWER = 'hp',
  WATT = 'W',
  
  // Length/Distance
  MILLIMETER = 'mm',
  CENTIMETER = 'cm',
  METER = 'm',
  INCH = 'in',
  
  // Velocity
  MM_PER_SECOND = 'mm/s',
  M_PER_SECOND = 'm/s',
  
  // Percentage
  PERCENT = 'percent',
  
  // Time
  SECOND = 's',
  MINUTE = 'min',
  HOUR = 'h',
  
  // Flow Rate
  LITERS_PER_MINUTE = 'L/min',
  GALLONS_PER_MINUTE = 'gpm',
  
  // Volume
  LITER = 'L',
  GALLON = 'gal',
  
  // Weight/Mass
  KILOGRAM = 'kg',
  POUND = 'lb',
  GRAM = 'g'
}