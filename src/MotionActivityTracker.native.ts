import { EventEmitter, Subscription } from "expo-modules-core";
import { PermissionsAndroid, Platform } from "react-native";

import MotionActivityTrackerModule from "./MotionActivityTrackerModule";
import {
  PermissionStatus,
  ActivityChangeEvent,
  TrackingStatus,
  HistoricalActivity,
  EventPayload,
} from "./types";

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
  listener: (payload: EventPayload) => void,
): Subscription {
  return emitter.addListener<EventPayload>("onMotionStateChange", listener);
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
    event.timestamp.toString(),
    event.confidence,
  );
}

/**
 * Get historical motion activity data from the device for iOS.
 * Only supported on iOS. On other platforms, it will return a warning and an empty array.
 * @param startDate - The start date of the historical data to fetch.
 * @param endDate - The end date of the historical data to fetch. Defaults to the current date.
 * @returns A promise that resolves to an array of historical motion activity data.
 */

export async function getHistoricalData(
  startDate: Date,
  endDate: Date = new Date(),
): Promise<HistoricalActivity[]> {
  const startTimestamp = startDate.getTime(),
    endTimestamp = endDate.getTime();

  if (Platform.OS === "ios") {
    return await MotionActivityTrackerModule.getHistoricalData(
      startTimestamp,
      endTimestamp,
    );
  }

  console.warn("getHistoricalData is only supported on iOS");

  return [];
}
