import { create } from "zustand";
import type { DayType, FilterState } from "../types/filters";

interface FilterStore extends FilterState {
  setDateRange: (start: string, end: string) => void;
  setDayType: (dayType: DayType) => void;
  setHourRange: (start: number, end: number) => void;
  setUserType: (userType: FilterState["userType"]) => void;
  setBikeType: (bikeType: FilterState["bikeType"]) => void;
  setStation: (stationId: string | null) => void;
  setOriginDestination: (originId: string | null, destinationId: string | null) => void;
  /** Resets every filter, including the date range, back to the given
   * defaults (the full dataset range). Used both to seed initial state and
   * for the user-facing "Clear filters" action. */
  resetFilters: (defaults: Pick<FilterState, "startDate" | "endDate">) => void;
}

const emptyDefaults: FilterState = {
  startDate: "",
  endDate: "",
  dayType: "all",
  hourStart: 0,
  hourEnd: 23,
  userType: null,
  bikeType: null,
  stationId: null,
  originStationId: null,
  destinationStationId: null,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...emptyDefaults,
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),
  setDayType: (dayType) => set({ dayType }),
  setHourRange: (hourStart, hourEnd) => set({ hourStart, hourEnd }),
  setUserType: (userType) => set({ userType }),
  setBikeType: (bikeType) => set({ bikeType }),
  setStation: (stationId) => set({ stationId }),
  setOriginDestination: (originStationId, destinationStationId) =>
    set({ originStationId, destinationStationId }),
  resetFilters: (defaults) =>
    set({
      ...emptyDefaults,
      startDate: defaults.startDate,
      endDate: defaults.endDate,
    }),
}));

export function isFilterActive(f: FilterState, defaults: Pick<FilterState, "startDate" | "endDate">): boolean {
  return (
    f.startDate !== defaults.startDate ||
    f.endDate !== defaults.endDate ||
    f.dayType !== "all" ||
    f.hourStart !== 0 ||
    f.hourEnd !== 23 ||
    f.userType !== null ||
    f.bikeType !== null ||
    f.stationId !== null ||
    f.originStationId !== null ||
    f.destinationStationId !== null
  );
}
