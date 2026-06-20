import { describe, expect, it } from 'vitest';
import {
  normaliseNlInput,
  parseNlNumber,
  parseNlNumberOrNull,
  parsePositiveNlNumberOrNull,
} from './nl-number';

describe('nl-number', () => {
  it('parses complete Dutch and dot-decimal numbers', () => {
    expect(parseNlNumber('1,82')).toBe(1.82);
    expect(parseNlNumber('1.82')).toBe(1.82);
    expect(parseNlNumber(',5')).toBe(0.5);
    expect(parseNlNumber(' 12 ')).toBe(12);
  });

  it('rejects partial or unsafe numeric strings', () => {
    expect(parseNlNumber('12abc')).toBeNaN();
    expect(parseNlNumber('1,2,3')).toBeNaN();
    expect(parseNlNumber('Infinity')).toBeNaN();
    expect(parseNlNumber('')).toBeNaN();
  });

  it('returns null for empty or invalid optional values', () => {
    expect(parseNlNumberOrNull('')).toBeNull();
    expect(parseNlNumberOrNull('-')).toBeNull();
    expect(parseNlNumberOrNull('abc')).toBeNull();
  });

  it('rejects negative values for resistance and target inputs', () => {
    expect(parsePositiveNlNumberOrNull('0')).toBe(0);
    expect(parsePositiveNlNumberOrNull('3,00')).toBe(3);
    expect(parsePositiveNlNumberOrNull('-1')).toBeNull();
  });

  it('normalises typed input without allowing multiple separators', () => {
    expect(normaliseNlInput('1a,2.3')).toBe('1,23');
    expect(normaliseNlInput('--1,2')).toBe('-1,2');
    expect(normaliseNlInput('1.2.3')).toBe('1.23');
  });
});
