// NOTE: All code must stay in English, even when requirements arrive in Spanish.
// Route coordinates are in farm-scene.png design space (1024×576) — same on every screen.

export type RoutePoint = {
  id: number;
  x: number;
  y: number;
};

export const ROUTE_POINT_COUNT = 8;

/** Farmer patrol waypoints along the dirt path around the fenced farm. */
export const ROUTE_POINTS: RoutePoint[] = [
  { id: 0, x: 797, y: 456 },
  { id: 1, x: 725, y: 483 },
  { id: 2, x: 624, y: 490 },
  { id: 3, x: 535, y: 476 },
  { id: 4, x: 450, y: 467 },
  { id: 5, x: 364, y: 469 },
  { id: 6, x: 277, y: 468 },
  { id: 7, x: 225, y: 467 },
];
