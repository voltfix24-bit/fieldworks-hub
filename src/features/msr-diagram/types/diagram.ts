export type DoorSide = 'left' | 'right' | 'top' | 'bottom';
export type MSRAnchor = 'tl' | 'tr' | 'bl' | 'br';

export interface MSRBlock {
  id: string;
  type: 'msr';
  x: number;
  y: number;
  width: number;
  height: number;
  housingNumber: string;
  doorSide: DoorSide;
}

export interface ElectrodeBlock {
  id: string;
  type: 'electrode';
  x: number;
  y: number;
  radius: number;
  label: string;
  anchor: MSRAnchor;
  overrideDistanceX?: number;
  overrideDistanceY?: number;
}

export interface DiagramState {
  msr: MSRBlock;
  electrodes: ElectrodeBlock[];
  selectedId: string | null;
}

export const PIXELS_PER_METER = 100;
