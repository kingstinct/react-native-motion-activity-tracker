import * as MotionActivityTracker from "motion-activity-tracker";
import React, { useEffect, useState } from "react";
import { Text, View, Button, StyleSheet, Platform } from "react-native";

export default function App() {
  const [message, setMessage] = useState("Initializing..."),
    [tracking, setTracking] = useState(false),
    [data, setData] = useState<
      MotionActivityTracker.HistoricalActivity[] | undefined
    >(),
    [permissionStatus, setPermissionStatus] =
      useState<MotionActivityTracker.PermissionStatus>(
        MotionActivityTracker.PermissionStatus.NOT_DETERMINED,
      ),
    [trackingStatus, setTrackingStatus] =
      useState<MotionActivityTracker.TrackingStatus>(
        MotionActivityTracker.TrackingStatus.STOPPED,
      ),
    [enterTransition, setEnterTransition] =
      useState<MotionActivityTracker.ActivityType>(
        MotionActivityTracker.ActivityType.UNKNOWN,
      ),
    [exitTransition, setExitTransition] =
      useState<MotionActivityTracker.ActivityType>(
        MotionActivityTracker.ActivityType.UNKNOWN,
      ),
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate = new Date();

  useEffect(() => {
    const setActivityHistoricalData = async () => {
      const data = await MotionActivityTracker.getHistoricalDataIos(
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
      (event) => {
        // Log the new state to confirm the subscription is working
        console.log("New Motion State:", event);

        const latestEvent = event[0];

        if (
          latestEvent.transitionType ===
          MotionActivityTracker.TransitionType.ENTER
        ) {
          setEnterTransition(latestEvent.activityType);
        }

        if (
          latestEvent.transitionType ===
          MotionActivityTracker.TransitionType.EXIT
        ) {
          setExitTransition(latestEvent.activityType);
        }
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
    const event: MotionActivityTracker.ActivityChangeEvent = {
      activityType: MotionActivityTracker.ActivityType.WALKING,
      transitionType: MotionActivityTracker.TransitionType.ENTER,
      confidence: MotionActivityTracker.Confidence.UNKNOWN,
      timestamp: new Date().getDate(),
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
