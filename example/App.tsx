import * as MotionActivityTracker from "motion-activity-tracker";
import React, { useEffect, useState } from "react";
import { Text, View, Button, StyleSheet } from "react-native";

export default function App() {
  const [message, setMessage] = useState("Initializing..."),
    [tracking, setTracking] = useState(false),
    [data, setData] = useState<
      MotionActivityTracker.HistoricalActivity[] | undefined
    >(),
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
    setActivityHistoricalData();
  }, []);

  useEffect(() => {
    const subscription = MotionActivityTracker.addMotionStateChangeListener(
      (event) => {
        // Log the new state to confirm the subscription is working
        console.log("New Motion State:", event.state);

        // Update the message with the current state
        setMessage(`Tracking started: ${event.state}`);
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
      console.log("Tracking started: ", result);
      setMessage(`Tracking started: ${result}`);
      setTracking(true); // Update the tracking state
    } catch (error) {
      setMessage(`Error: ${error}`);
      console.error(error);
    }
  };

  // Handle stop tracking
  const handleStopTracking = () => {
    MotionActivityTracker.stopTracking();
    setMessage("Tracking stopped");
    setTracking(false); // Update the tracking state
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      <Button
        title={tracking ? "Stop Tracking" : "Start Tracking"}
        onPress={tracking ? handleStopTracking : handleStartTracking}
      />
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
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "black",
  },
});
