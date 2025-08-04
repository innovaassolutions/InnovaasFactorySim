# Data Format Comparison: UNS vs UMH Core

This document shows the differences between UNS and UMH Core data formats supported by the CNC Simulator.

## Topic Structure Comparison

### UNS Format (Original)
```
uns-demo/factory-floor/machining/cell-01/cnc-001/info/sensors/spindle-speed
```

### UMH Core Format  
```
umh.v1.uns-demo.factory-floor.machining.cell-01.cnc-001._raw.spindle_speed
```

## Message Payload Comparison

### UNS Format Message
```json
{
  "timestamp": "2025-01-01T10:30:45.123Z",
  "source": "cnc-001",
  "value": 2450,
  "unit": "rpm",
  "quality": "good",
  "metadata": {
    "max_rpm": 8100,
    "phase": "machining"
  }
}
```

### UMH Core Format Message
```json
{
  "value": 2450,
  "timestamp_ms": 1735732245123
}
```

## UMH Core Metadata (Internal Processing)

When converting to UMH Core format, the simulator adds metadata for internal processing:

```json
{
  "location_path": "uns-demo.factory-floor.machining.cell-01.cnc-001",
  "data_contract": "_raw",
  "tag_name": "spindle_speed",
  "unit": "rpm",
  "quality": "good",
  "source": "cnc-001",
  "original_metadata": {
    "max_rpm": 8100,
    "phase": "machining"
  }
}
```

## Key Differences

| Aspect | UNS Format | UMH Core Format |
|--------|------------|-----------------|
| **Topic Separator** | `/` (forward slash) | `.` (dot) |
| **Topic Prefix** | Custom enterprise | `umh.v1` standard |
| **Sensor Naming** | `kebab-case` | `snake_case` |
| **Timestamp** | ISO 8601 string | Milliseconds number |
| **Payload Size** | Rich metadata | Minimal core data |
| **Data Contract** | Implicit | Explicit `_raw` |
| **Location Path** | In topic | In metadata |

## Configuration

Set the `OUTPUT_FORMAT` environment variable to control format:

- `OUTPUT_FORMAT=uns` - Original UNS format (default)
- `OUTPUT_FORMAT=umh` - UMH Core compatible format
- `OUTPUT_FORMAT=both` - Publish both formats simultaneously

## UMH Core Integration Benefits

Using UMH Core format enables:

1. **Direct UMH Core Processing** - No topic/payload conversion needed
2. **Data Contracts** - Structured data validation and evolution
3. **Location Path Metadata** - Hierarchical location tracking
4. **Standardized Timestamps** - Millisecond precision for time-series
5. **Minimal Network Overhead** - Compact payload format

## Migration Strategy

For existing UNS deployments:

1. **Phase 1**: Run with `OUTPUT_FORMAT=both` to maintain compatibility
2. **Phase 2**: Update downstream consumers to handle UMH Core format
3. **Phase 3**: Switch to `OUTPUT_FORMAT=umh` for full UMH Core integration

This approach ensures zero-downtime migration while enabling UMH Core features.