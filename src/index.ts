import { EventEmitter, Subscription } from "expo-modules-core";

import { MotionActivityTrackerViewProps } from "./MotionActivityTracker.types";
import MotionActivityTrackerModule from "./MotionActivityTrackerModule";

enum Confidence {
  "low" = 0,
  "medium" = 1,
  "high" = 2,
}

export type HistoricalActivity = {
  walking: boolean;
  running: boolean;
  automotive: boolean;
  stationary: boolean;
  cycling: boolean;
  unknown: boolean;
  timestamp: number;
  confidence: Confidence;
};

export enum MotionState {
  UNKNOWN = "unknown",
  WALKING = "walking",
  RUNNING = "running",
  AUTOMOTIVE = "automotive",
  STATIONARY = "stationary",
  CYCLING = "cycling",
}

export enum MotionActivityAuthStatus {
  NOT_DETERMINED = 0,
  RESTRICTED = 1,
  DENIED = 2,
  AUTHORIZED = 3,
}

export type MotionStateChangeEvent = {
  state: MotionState;
};

const emitter = new EventEmitter(MotionActivityTrackerModule);

export async function startTracking(): Promise<string> {
  return await MotionActivityTrackerModule.startTracking();
}

export function stopTracking(): string {
  return MotionActivityTrackerModule.stopTracking();
}

export function addMotionStateChangeListener(
  listener: (event: MotionStateChangeEvent) => void,
): Subscription {
  return emitter.addListener<MotionStateChangeEvent>(
    "onMotionStateChange",
    listener,
  );
}

export async function getHistoricalData(
  startDate: Date,
  endDate: Date,
): Promise<HistoricalActivity[]> {
  const startTimestamp = startDate.getTime(),
    endTimestamp = endDate.getTime();

  return await MotionActivityTrackerModule.getHistoricalData(
    startTimestamp,
    endTimestamp,
  );
}

export async function checkMotionActivityAuthStatus(): Promise<MotionActivityAuthStatus> {
  const status =
    await MotionActivityTrackerModule.checkMotionActivityAuthStatus();
  return status as MotionActivityAuthStatus;
}

export { MotionActivityTrackerViewProps };
