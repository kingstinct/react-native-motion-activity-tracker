import { EventEmitter, Subscription } from "expo-modules-core";
import { PermissionsAndroid, Platform } from "react-native";

import {
  PermissionStatus,
  ActivityChangeEvent,
  TrackingStatus,
  HistoricalActivity,
} from "./MotionActivityTracker.types";
import MotionActivityTrackerModule from "./MotionActivityTrackerModule";

export const isGooglePlayServicesAvailable: boolean =
  MotionActivityTrackerModule.isGooglePlayServicesAvailable ?? false;

export async function getPermissionStatusAsync(): Promise<PermissionStatus> {
  return MotionActivityTrackerModule.getPermissionStatus();
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
  listener: (event: ActivityChangeEvent[]) => void,
): Subscription {
  return emitter.addListener<ActivityChangeEvent[]>(
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
