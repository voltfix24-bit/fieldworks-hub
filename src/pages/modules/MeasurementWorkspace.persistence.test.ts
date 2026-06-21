import { describe, it, expect, beforeEach } from 'vitest';
import {
  workspaceStorageKey,
  readStoredWorkspaceState,
  writeStoredWorkspaceState,
} from './MeasurementWorkspace';

const PROJECT = 'proj-123';
const KEY = `measurement-workspace:${PROJECT}`;

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('workspace sessionStorage persistence', () => {
  it('returns null when no key', () => {
    expect(workspaceStorageKey(undefined)).toBeNull();
    expect(readStoredWorkspaceState(undefined)).toBeNull();
  });

  it('round-trips step + active ids', () => {
    writeStoredWorkspaceState(PROJECT, { step: 1, activeElectrodeId: 'e1', activePenId: 'p1' });
    const stored = readStoredWorkspaceState(PROJECT);
    expect(stored?.step).toBe(1);
    expect(stored?.activeElectrodeId).toBe('e1');
    expect(stored?.activePenId).toBe('p1');
  });

  it('does NOT wipe a stored id when a null write happens (initial mount race)', () => {
    writeStoredWorkspaceState(PROJECT, { step: 0, activeElectrodeId: 'e1', activePenId: 'p1' });
    const prev = readStoredWorkspaceState(PROJECT);
    // simulate first render where state was rehydrated but data not yet loaded
    writeStoredWorkspaceState(PROJECT, { step: 0, activeElectrodeId: null, activePenId: null }, prev);
    const after = readStoredWorkspaceState(PROJECT);
    expect(after?.activeElectrodeId).toBe('e1');
    expect(after?.activePenId).toBe('p1');
  });

  it('overwrites stored ids when new non-null ids are provided (fallback after deletion)', () => {
    writeStoredWorkspaceState(PROJECT, { step: 0, activeElectrodeId: 'e-deleted', activePenId: 'p-deleted' });
    const prev = readStoredWorkspaceState(PROJECT);
    writeStoredWorkspaceState(PROJECT, { step: 0, activeElectrodeId: 'e2', activePenId: 'p2' }, prev);
    const after = readStoredWorkspaceState(PROJECT);
    expect(after?.activeElectrodeId).toBe('e2');
    expect(after?.activePenId).toBe('p2');
  });

  it('drops corrupted payloads', () => {
    window.sessionStorage.setItem(KEY, '{not json');
    expect(readStoredWorkspaceState(PROJECT)).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('drops non-object payloads', () => {
    window.sessionStorage.setItem(KEY, '"a string"');
    expect(readStoredWorkspaceState(PROJECT)).toBeNull();
  });
});
