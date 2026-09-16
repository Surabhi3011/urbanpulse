import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre spawns its own worker script at runtime; Rollup can't trace that
// dynamic reference, so the worker file never lands in the production build
// unless we import it explicitly as a static asset URL (`?url`) and register
// it via setWorkerUrl before creating a Map -- MapLibre's documented fix for
// exactly this bundler gap.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useEffect, useRef } from "react";
import type { RouteMetric, Station } from "../../types/data";
import { squareAround } from "../../utils/geo";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** CARTO's style JSON declares its vector source as `{ url: ".../tiles.json" }`
 * -- a TileJSON indirection MapLibre is supposed to resolve itself by
 * fetching that URL and merging in the `tiles` array it returns. In this
 * app's environment that resolution silently never completes: the style,
 * sprite, and the tiles.json itself all fetch fine (confirmed directly),
 * but the map then never fires `load` and never requests a single map
 * tile -- it just hangs on a blank canvas with no error. Swapping MapLibre's
 * own demo style in confirmed the bug is specific to this indirection, not
 * our map setup, so we resolve it ourselves on the main thread (where plain
 * `fetch` demonstrably works) before ever constructing the Map. */
async function resolveCartoStyle(styleUrl: string): Promise<maplibregl.StyleSpecification> {
  const style = await fetch(styleUrl).then((r) => r.json());
  await Promise.all(
    Object.entries(style.sources as Record<string, any>).map(async ([id, source]) => {
      if (source?.type === "vector" && typeof source.url === "string") {
        const tilejson = await fetch(source.url).then((r) => r.json());
        style.sources[id] = {
          type: "vector",
          tiles: tilejson.tiles,
          minzoom: tilejson.minzoom,
          maxzoom: tilejson.maxzoom,
          attribution: tilejson.attribution,
        };
      }
    })
  );
  return style;
}

export interface MapStation extends Station {
  /** Activity value under the current filters (may differ from total_activity). */
  filteredActivity: number;
}

interface StationMapProps {
  stations: MapStation[];
  routes: RouteMetric[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
  show3D: boolean;
  showRoutes: boolean;
}

function stationsToGeoJSON(stations: MapStation[]): GeoJSON.FeatureCollection {
  const maxActivity = Math.max(1, ...stations.map((s) => s.filteredActivity));
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: {
        station_id: s.station_id,
        name: s.name,
        activity: s.filteredActivity,
        radius: 4 + 16 * Math.sqrt(s.filteredActivity / maxActivity),
        heightScaled: 20 + 800 * (s.filteredActivity / maxActivity),
        memberShare: s.member_share_starts,
        avgDuration: s.avg_start_duration_min,
        topDestination: s.top_destination_name ?? "—",
      },
    })),
  };
}

function stations3DToGeoJSON(stations: MapStation[]): GeoJSON.FeatureCollection {
  const maxActivity = Math.max(1, ...stations.map((s) => s.filteredActivity));
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [squareAround(s.lng, s.lat, 35)] },
      properties: {
        station_id: s.station_id,
        height: 20 + 800 * (s.filteredActivity / maxActivity),
        colorValue: s.filteredActivity / maxActivity,
      },
    })),
  };
}

function routesToGeoJSON(routes: RouteMetric[]): GeoJSON.FeatureCollection {
  const maxTrips = Math.max(1, ...routes.map((r) => r.trips));
  return {
    type: "FeatureCollection",
    features: routes.map((r) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [r.start_lng, r.start_lat],
          [r.end_lng, r.end_lat],
        ],
      },
      properties: {
        trips: r.trips,
        width: 1 + 4 * (r.trips / maxTrips),
      },
    })),
  };
}

export function StationMap({
  stations,
  routes,
  selectedStationId,
  onSelectStation,
  show3D,
  showRoutes,
}: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      let style: maplibregl.StyleSpecification;
      try {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        style = await resolveCartoStyle(prefersDark ? DARK_STYLE : LIGHT_STYLE);
      } catch (err) {
        console.error("UrbanPulse: failed to load the map basemap style.", err);
        return;
      }
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: [-73.97, 40.75],
        zoom: 11.5,
        pitch: 0,
        attributionControl: { compact: true },
      });

      if (stations.length > 0) {
        // Use the 2nd-98th percentile rather than raw min/max so a handful of
        // outlier stations (e.g. far edges of the system) don't zoom out the
        // default view for everyone else.
        const percentile = (values: number[], p: number) => {
          const sorted = [...values].sort((a, b) => a - b);
          return sorted[Math.floor((sorted.length - 1) * p)];
        };
        const lngs = stations.map((s) => s.lng);
        const lats = stations.map((s) => s.lat);
        map.fitBounds(
          [
            [percentile(lngs, 0.02), percentile(lats, 0.02)],
            [percentile(lngs, 0.98), percentile(lats, 0.98)],
          ],
          { padding: 24, duration: 0 }
        );
      }
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      mapRef.current = map;
      popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 10 });

      // The container sits inside a CSS grid whose column width can still be
      // settling (sidebar content, fonts, etc.) after this effect runs, so
      // MapLibre's internal viewport can end up stale relative to the actual
      // laid-out size. MapLibre only auto-resizes on window resize, not on
      // layout-driven container resizes, so watch the container directly.
      resizeObserver = new ResizeObserver(() => map.resize());
      resizeObserver.observe(containerRef.current);

      map.on("load", () => {
      map.addSource("stations", { type: "geojson", data: stationsToGeoJSON(stations) });
      map.addSource("stations-3d", { type: "geojson", data: stations3DToGeoJSON(stations) });
      map.addSource("routes", { type: "geojson", data: routesToGeoJSON(routes) });

      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        layout: { visibility: showRoutes ? "visible" : "none" },
        paint: {
          "line-color": "#f97316",
          "line-width": ["get", "width"],
          "line-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "stations-circle",
        type: "circle",
        source: "stations",
        layout: { visibility: show3D ? "none" : "visible" },
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.75,
          "circle-stroke-width": [
            "case",
            ["==", ["get", "station_id"], selectedStationId ?? "__none__"],
            3,
            1,
          ],
          "circle-stroke-color": [
            "case",
            ["==", ["get", "station_id"], selectedStationId ?? "__none__"],
            "#f97316",
            "#1d4ed8",
          ],
        },
      });

      map.addLayer({
        id: "stations-3d-fill",
        type: "fill-extrusion",
        source: "stations-3d",
        layout: { visibility: show3D ? "visible" : "none" },
        paint: {
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "colorValue"],
            0,
            "#93c5fd",
            1,
            "#1d4ed8",
          ],
          "fill-extrusion-opacity": 0.85,
        },
      });

      const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0];
        if (!f) return;
        onSelectStation(f.properties?.station_id ?? null);
      };
      const handleEnter = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || !popupRef.current) return;
        const p = f.properties as any;
        popupRef.current
          .setLngLat((f.geometry as any).coordinates.length === 2 ? (f.geometry as any).coordinates : e.lngLat)
          .setHTML(
            `<div style="font: 13px system-ui; color:#111"><strong>${p.name}</strong><br/>Activity: ${Math.round(p.activity ?? p.height ?? 0)}<br/>${p.topDestination ? `Top destination: ${p.topDestination}` : ""}</div>`
          )
          .addTo(map);
      };
      const handleLeave = () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      };

      map.on("click", "stations-circle", handleClick);
      map.on("mouseenter", "stations-circle", handleEnter);
      map.on("mouseleave", "stations-circle", handleLeave);
      map.on("click", "stations-3d-fill", handleClick);
      map.on("mouseenter", "stations-3d-fill", handleEnter);
      map.on("mouseleave", "stations-3d-fill", handleLeave);

        loadedRef.current = true;
      });
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    (map.getSource("stations") as maplibregl.GeoJSONSource)?.setData(stationsToGeoJSON(stations));
    (map.getSource("stations-3d") as maplibregl.GeoJSONSource)?.setData(stations3DToGeoJSON(stations));
  }, [stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    (map.getSource("routes") as maplibregl.GeoJSONSource)?.setData(routesToGeoJSON(routes));
  }, [routes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setLayoutProperty("stations-circle", "visibility", show3D ? "none" : "visible");
    map.setLayoutProperty("stations-3d-fill", "visibility", show3D ? "visible" : "none");
    map.easeTo({ pitch: show3D ? 55 : 0, duration: 500 });
  }, [show3D]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setLayoutProperty("routes-line", "visibility", showRoutes ? "visible" : "none");
  }, [showRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    map.setPaintProperty("stations-circle", "circle-stroke-width", [
      "case",
      ["==", ["get", "station_id"], selectedStationId ?? "__none__"],
      3,
      1,
    ]);
    map.setPaintProperty("stations-circle", "circle-stroke-color", [
      "case",
      ["==", ["get", "station_id"], selectedStationId ?? "__none__"],
      "#f97316",
      "#1d4ed8",
    ]);
  }, [selectedStationId]);

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
