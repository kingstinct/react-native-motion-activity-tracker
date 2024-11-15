import { EventEmitter, Subscription } from "expo-modules-core";
import { PermissionsAndroid, Platform } from "react-native";

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

export async function getHistoricalDataIos(
  startDate: Date,
  endDate: Date,
): Promise<HistoricalActivity[]> {
  if (Platform.OS === "ios") {
    const startTimestamp = startDate.getTime(),
      endTimestamp = endDate.getTime();

    return await MotionActivityTrackerModule.getHistoricalData(
      startTimestamp,
      endTimestamp,
    );
  }

  return [];
}

export async function checkMotionActivityAuthStatus(): Promise<MotionActivityAuthStatus> {
  const status =
    await MotionActivityTrackerModule.checkMotionActivityAuthStatus();

  return status as MotionActivityAuthStatus;
}

export const requestActivityPermissionsAsync =
  async (): Promise<MotionActivityAuthStatus> => {
    if (Platform.OS === "android") {
      const permissionStatus: number =
        MotionActivityTrackerModule.checkMotionActivityAuthStatus();

      if (permissionStatus === 3) {
        return MotionActivityAuthStatus.AUTHORIZED;
      }

      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: "Activity Recognition Permission",
            message:
              "This app wants access to activity recognition to track your movements.",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );

        const newPermissionStatus: number =
          MotionActivityTrackerModule.checkMotionActivityAuthStatus();

        if (newPermissionStatus === 3) {
          return MotionActivityAuthStatus.AUTHORIZED;
        }

        return MotionActivityAuthStatus.DENIED;
      } catch (err) {
        console.warn(err);
        return MotionActivityAuthStatus.DENIED;
      }
    }

    return MotionActivityAuthStatus.DENIED;
  };

export { MotionActivityTrackerViewProps };
