// UMH Core Compatible Type Definitions
// Based on UMH Core documentation: https://docs.umh.app/

export interface UMHPayload {
  value: number | string | boolean;
  timestamp_ms: number;
}

export interface UMHMetadata {
  location_path: string;
  data_contract: string;
  tag_name: string;
  // Optional additional metadata
  unit?: string;
  quality?: 'good' | 'bad' | 'uncertain';
  source?: string;
  [key: string]: any;
}

export interface UMHMessage {
  payload: UMHPayload;
  metadata: UMHMetadata;
  topic: string;
}

// UMH Core Topic Structure: umh.v1.{enterprise}.{site}.{area}.{work_cell}.{machine}.{data_contract}.{tag_name}
export interface UMHTopicComponents {
  prefix: 'umh.v1';
  enterprise: string;
  site: string;
  area: string;
  work_cell: string;
  machine: string;
  data_contract: string;
  tag_name: string;
}

export function buildUMHTopic(components: Omit<UMHTopicComponents, 'prefix'>): string {
  return `umh.v1.${components.enterprise}.${components.site}.${components.area}.${components.work_cell}.${components.machine}.${components.data_contract}.${components.tag_name}`;
}

export function buildLocationPath(enterprise: string, site: string, area: string, work_cell: string, machine: string): string {
  return `${enterprise}.${site}.${area}.${work_cell}.${machine}`;
}

// Standard UMH Core data contracts
export const UMH_DATA_CONTRACTS = {
  RAW: '_raw',
  STRUCTURED: '_structured',
  // Add more as needed based on UMH Core documentation
} as const;

export type UMHDataContract = typeof UMH_DATA_CONTRACTS[keyof typeof UMH_DATA_CONTRACTS];