/** Builds a small square polygon (GeoJSON ring) centered on [lon, lat],
 * `sizeMeters` wide, for use as a fill-extrusion "column" base since
 * MapLibre can only extrude polygons, not points. */
export function squareAround(lon: number, lat: number, sizeMeters: number): number[][] {
  const half = sizeMeters / 2;
  const latDeg = half / 111_320;
  const lonDeg = half / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - lonDeg, lat - latDeg],
    [lon + lonDeg, lat - latDeg],
    [lon + lonDeg, lat + latDeg],
    [lon - lonDeg, lat + latDeg],
    [lon - lonDeg, lat - latDeg],
  ];
}
