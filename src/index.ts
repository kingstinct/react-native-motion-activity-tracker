import { EventEmitter, Subscription } from "expo-modules-core";
import { PermissionsAndroid, Platform } from "react-native";

import { MotionActivityTrackerViewProps } from "./MotionActivityTracker.types";
import MotionActivityTrackerModule from "./MotionActivityTrackerModule";

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

enum Confidence {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum ActivityType {
  UNKNOWN = "UNKNOWN",
  WALKING = "WALKING",
  RUNNING = "RUNNING",
  AUTOMOTIVE = "AUTOMOTIVE",
  STATIONARY = "STATIONARY",
  CYCLING = "CYCLING",
}

export enum TransitionType {
  ENTER = "ENTER",
  EXIT = "EXIT",
}

export enum PermissionStatus {
  NOT_DETERMINED = "NOT_DETERMINED",
  RESTRICTED = "RESTRICTED",
  DENIED = "DENIED",
  AUTHORIZED = "AUTHORIZED",
  UNAVAILABLE = "UNAVAILABLE",
  PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED",
}

export enum TrackingStatus {
  STARTED = "STARTED",
  STOPPED = "STOPPED",
  FAILED = "FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export type ActivityChangeEvent = {
  activityType: ActivityType;
  transitionType: TransitionType;
};

export const isGooglePlayServicesAvailable: boolean =
  MotionActivityTrackerModule.isGooglePlayServicesAvailable ?? false;

export async function getPermissionStatusAsync(): Promise<PermissionStatus> {
  const status = await MotionActivityTrackerModule.getPermissionStatus();
  return status;
}

export async function requestPermissionsAsyncAndroid(): Promise<PermissionStatus> {
  if (Platform.OS === "android") {
    const permissionStatus: PermissionStatus = await getPermissionStatusAsync();

    if (permissionStatus === PermissionStatus.AUTHORIZED) {
      return permissionStatus;
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

      const newPermissionStatus: PermissionStatus =
        await getPermissionStatusAsync();

      if (newPermissionStatus === PermissionStatus.AUTHORIZED) {
        return newPermissionStatus;
      }

      return PermissionStatus.DENIED;
    } catch (err) {
      console.warn(err);
      return PermissionStatus.NOT_DETERMINED;
    }
  }

  return PermissionStatus.PLATFORM_NOT_SUPPORTED;
}

const emitter = new EventEmitter(MotionActivityTrackerModule);

export function addMotionStateChangeListener(
  listener: (event: ActivityChangeEvent) => void,
): Subscription {
  return emitter.addListener<ActivityChangeEvent>(
    "onMotionStateChange",
    listener,
  );
}

export async function startTracking(): Promise<TrackingStatus> {
  return MotionActivityTrackerModule.startTracking();
}

export async function stopTracking(): Promise<TrackingStatus> {
  return MotionActivityTrackerModule.stopTracking();
}

export function simulateActivityTransition(event: ActivityChangeEvent): void {
  return MotionActivityTrackerModule.simulateActivityTransition(
    event.activityType,
    event.transitionType,
  );
}

export async function getHistoricalDataIos(
  startDate: Date,
  endDate: Date,
): Promise<HistoricalActivity[]> {
  const startTimestamp = startDate.getTime(),
    endTimestamp = endDate.getTime();

  if (Platform.OS === "ios") {
    return await MotionActivityTrackerModule.getHistoricalData(
      startTimestamp,
      endTimestamp,
    );
  }

  return [];
}

export { MotionActivityTrackerViewProps };
