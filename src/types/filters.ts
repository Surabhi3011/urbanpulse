export type DayType = "all" | "weekday" | "weekend";

export interface FilterState {
  /** Inclusive ISO date bounds. Defaults to the full dataset range. */
  startDate: string;
  endDate: string;
  dayType: DayType;
  /** Inclusive hour-of-day bounds, 0-23. */
  hourStart: number;
  hourEnd: number;
  /** null = both user types */
  userType: "member" | "casual" | null;
  bikeType: string | null;
  /** Station-scoped filters, used by the Spatial & Network Explorer. */
  stationId: string | null;
  originStationId: string | null;
  destinationStationId: string | null;
}

export const DEFAULT_HOUR_RANGE: [number, number] = [0, 23];
