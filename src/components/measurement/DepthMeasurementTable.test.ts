import { describe, expect, it } from 'vitest';
import { getDepthProgressionWarnings } from './DepthMeasurementTable';

describe('getDepthProgressionWarnings', () => {
  it('flags deeper measurements that are higher than the previous filled depth', () => {
    const warnings = getDepthProgressionWarnings([
      { id: 'depth-6', depth_meters: 6, resistance_value: 2.1, sort_order: 1 },
      { id: 'depth-3', depth_meters: 3, resistance_value: 2.4, sort_order: 0 },
      { id: 'depth-9', depth_meters: 9, resistance_value: 2.3, sort_order: 2 },
    ]);

    expect([...warnings]).toEqual(['depth-9']);
  });

  it('ignores empty rows while comparing filled values', () => {
    const warnings = getDepthProgressionWarnings([
      { id: 'depth-3', depth_meters: 3, resistance_value: 3, sort_order: 0 },
      { id: 'depth-6', depth_meters: 6, resistance_value: 0, sort_order: 1 },
      { id: 'depth-9', depth_meters: 9, resistance_value: 2.8, sort_order: 2 },
    ]);

    expect(warnings.size).toBe(0);
  });
});
