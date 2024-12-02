import * as MotionActivityTracker from "motion-activity-tracker";
import {
  PermissionStatus,
  HistoricalActivity,
  TrackingStatus,
  ActivityType,
  ActivityChangeEvent,
  TransitionType,
  Confidence,
} from "motion-activity-tracker/types";
import React, { useEffect, useState } from "react";
import { Text, View, Button, StyleSheet, Platform } from "react-native";

export default function App() {
  const [message, setMessage] = useState("Initializing..."),
    [data, setData] = useState<HistoricalActivity[] | undefined>(),
    [permissionStatus, setPermissionStatus] = useState<PermissionStatus>(
      PermissionStatus.NOT_DETERMINED,
    ),
    [trackingStatus, setTrackingStatus] = useState<TrackingStatus>(
      TrackingStatus.STOPPED,
    ),
    [enterTransition, setEnterTransition] = useState<ActivityType>(
      ActivityType.UNKNOWN,
    ),
    [exitTransition, setExitTransition] = useState<ActivityType>(
      ActivityType.UNKNOWN,
    ),
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate = new Date();

  useEffect(() => {
    const setActivityHistoricalData = async () => {
      const data = await MotionActivityTracker.getHistoricalData(
        startDate,
        endDate,
      );
      if (data) {
        console.log(data[0]);
        setData(data);
      }
    };

    if (Platform.OS === "ios") {
      setActivityHistoricalData();
    }
  }, []);

  useEffect(() => {
    const subscription = MotionActivityTracker.addMotionStateChangeListener(
      (payload) => {
        // Log the new state to confirm the subscription is working
        console.log("New Motion State:", payload);

        payload.events.forEach((event) => {
          if (event.transitionType === TransitionType.ENTER) {
            setEnterTransition(event.activityType);
          }

          if (event.transitionType === TransitionType.EXIT) {
            setExitTransition(event.activityType);
          }
        });
      },
    );

    return () => {
      subscription.remove();
    };
  }, [message]);

  const handleStartTracking = async () => {
    console.log("Starting tracking...");
    try {
      const result = await MotionActivityTracker.startTracking();
      setTrackingStatus(result);
    } catch (error) {
      setMessage(`Error: ${error}`);
      console.error(error);
    }
  };

  // Handle stop tracking
  const handleStopTracking = async () => {
    const result = await MotionActivityTracker.stopTracking();
    setTrackingStatus(result);
  };

  const handleGetPermissionStatus = async () => {
    const status = await MotionActivityTracker.getPermissionStatusAsync();
    setPermissionStatus(status);
  };

  const handleRequestPermissions = async () => {
    const result = await MotionActivityTracker.requestPermissionsAsyncAndroid();
    setPermissionStatus(result);
  };

  const handleSimulateTransition = () => {
    const event: ActivityChangeEvent = {
      activityType: ActivityType.WALKING,
      transitionType: TransitionType.ENTER,
      confidence: Confidence.UNKNOWN,
      timestamp: new Date().getTime(),
    };

    MotionActivityTracker.simulateActivityTransition(event);
  };

  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
      >{`Is Google Play available: ${MotionActivityTracker.isGooglePlayServicesAvailable}`}</Text>
      <Text
        style={styles.text}
      >{`Permission Status: ${permissionStatus}`}</Text>

      <Text style={styles.text}>{`Tracking Status: ${trackingStatus}`}</Text>
      <Text style={styles.text}>{`Enter Transition: ${enterTransition}`}</Text>
      <Text style={styles.text}>{`Exit Transition: ${exitTransition}`}</Text>

      <Button
        title="Get Permission Status"
        onPress={handleGetPermissionStatus}
      />
      <Button title="Request Permissions" onPress={handleRequestPermissions} />
      <Button title="Start Tracking" onPress={handleStartTracking} />
      <Button title="Stop Tracking" onPress={handleStopTracking} />
      <Button title="Simulate Transition" onPress={handleSimulateTransition} />
      {data && data.length > 0 && (
        <View>
          {/* Get the latest entry by finding the one with the maximum timestamp */}
          {(() => {
            const latestActivity = data.reduce((latest, current) =>
              current.timestamp > latest.timestamp ? current : latest,
            );

            return (
              <>
                <Text style={styles.text}>
                  Automotive: {latestActivity.automotive ? "Yes" : "No"}
                </Text>
                <Text style={styles.text}>
                  Running: {latestActivity.running ? "Yes" : "No"}
                </Text>
                <Text style={styles.text}>
                  Stationary: {latestActivity.stationary ? "Yes" : "No"}
                </Text>
                <Text style={styles.text}>
                  Timestamp:
                  {new Date(latestActivity.timestamp * 1000).toLocaleString()}
                </Text>
                <Text style={styles.text}>
                  Unknown: {latestActivity.unknown ? "Yes" : "No"}
                </Text>
                <Text style={styles.text}>
                  Walking: {latestActivity.walking ? "Yes" : "No"}
                </Text>
                <Text style={styles.text}>
                  Confidence: {latestActivity.confidence}
                </Text>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 30,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "black",
  },
});
