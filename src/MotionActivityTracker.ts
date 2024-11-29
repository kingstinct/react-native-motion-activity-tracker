import { Platform } from "react-native";

  function UnavailableFn<T = unknown>(retVal: T) {
  let hasWarned = false;
  return () => {
    if (!hasWarned) {
      console.warn(
        `MotionActivityTracker is not available on platform "${Platform.OS}"`,
      );
      hasWarned = true;
    }
    return retVal;
  };
}


export const getPermissionStatusAsync = UnavailableFn(
  Promise.resolve("PLATFORM_NOT_SUPPORTED"),
);

export const startTracking = UnavailableFn(Promise.resolve("FAILED"));
export const stopTracking = UnavailableFn(Promise.resolve("FAILED"));
export const getHistoricalData = UnavailableFn(Promise.resolve([]));
export const simulateActivityTransition = UnavailableFn(undefined);
export const requestPermissionsAsyncAndroid = UnavailableFn(
  Promise.resolve("PLATFORM_NOT_SUPPORTED"),
);

export function addMotionStateChangeListener() {
  console.warn(
    "Motion state change listeners are not supported on this platform.",
  );
  return { remove: () => {} };
}