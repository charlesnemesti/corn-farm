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
  { id: 0, x: 248, y: 448 },
  { id: 1, x: 368, y: 448 },
  { id: 2, x: 488, y: 448 },
  { id: 3, x: 608, y: 448 },
  { id: 4, x: 728, y: 448 },
  { id: 5, x: 848, y: 430 },
  { id: 6, x: 848, y: 330 },
  { id: 7, x: 728, y: 280 },
];
