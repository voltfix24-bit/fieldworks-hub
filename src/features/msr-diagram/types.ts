export type DoorSide = 'left' | 'right' | 'top' | 'bottom';
export type MSRAnchor = 'tl' | 'tr' | 'bl' | 'br';

export interface DiagramElectrode {
  id: string;
  label: string;
  /** Position in diagram units (0..canvasSize.w / h) */
  x: number;
  y: number;
  /** MSR corner used as reference for horizontal/vertical distance labels. */
  anchor?: MSRAnchor;
  /** Manual distance overrides in meters, useful when the sketch is not exactly to scale. */
  overrideDistanceX?: number | null;
  overrideDistanceY?: number | null;
}

export interface DiagramCabinet {
  housingNumber: string;
  /** Top-left corner in diagram units */
  x: number;
  y: number;
  w: number;
  h: number;
  doorSide: DoorSide;
}

export interface MSRDiagram {
  version: 1;
  canvasSize: { w: number; h: number };
  cabinet: DiagramCabinet;
  electrodes: DiagramElectrode[];
  /** Scale: meters per diagram unit (informative). */
  metersPerUnit?: number;
}

export const DEFAULT_DIAGRAM: MSRDiagram = {
  version: 1,
  canvasSize: { w: 800, h: 800 },
  cabinet: {
    housingNumber: '',
    x: 340,
    y: 340,
    w: 120,
    h: 120,
    doorSide: 'right',
  },
  electrodes: [],
  metersPerUnit: 0.05, // 1 diagram-unit = 5 cm
};
