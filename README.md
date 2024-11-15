# react-native-motion-activity-tracker

[![Test Status](https://github.com/YourGithubUsername/react-native-motion-activity-tracker/actions/workflows/test.yml/badge.svg)](https://github.com/YourGithubUsername/react-native-motion-activity-tracker/actions/workflows/test.yml)
[![Latest version on NPM](https://img.shields.io/npm/v/react-native-motion-activity-tracker)](https://www.npmjs.com/package/react-native-motion-activity-tracker)
[![Discord](https://dcbadge.vercel.app/api/server/5wQGsRfS?style=flat)](https://discord.gg/5wQGsRfS)


A React Native library to access and track motion activity data using Apple's Core Motion API. It supports activities like walking, running, automotive, stationary, and cycling, with real-time updates and historical data fetching.

## Features

- Check motion activity authorization status.
- Start and stop real-time motion tracking.
- Fetch historical activity data.
- Built for iOS with Core Motion.

**Note**: This library requires a custom dev client when using with Expo.

# React Native Motion Activity Tracker

## Managed Expo Workflow

### Installation

1. Install the package:

   ```bash
   npm install react-native-motion-activity-tracker

```
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMotionUsageDescription": "This app uses motion data to track your activity."
      }
    },
  }
}
```


# Examples

```TypeScript
import * as MotionActivityTracker from "motion-activity-tracker";
import React, { useEffect, useState } from "react";
import { Text, View, Button, StyleSheet } from "react-native";

export default function App() {
  const [message, setMessage] = useState("Initializing...");
  const [tracking, setTracking] = useState(false);
  const [data, setData] = useState<
    MotionActivityTracker.HistoricalActivity[] | undefined
  >();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // One week ago
  const endDate = new Date();

  // Fetch historical activity data
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

  // Subscribe to motion state changes
  useEffect(() => {
    const subscription = MotionActivityTracker.addMotionStateChangeListener(
      (event) => {
        console.log("New Motion State:", event.state); // Log the new state
        setMessage(`Tracking started: ${event.state}`); // Update the message
      },
    );

    return () => {
      subscription.remove(); // Clean up subscription on unmount
    };
  }, [message]);

  const handleStartTracking = async () => {
    try {
      const result = await MotionActivityTracker.startTracking();
      setMessage(`Tracking started: ${result}`);
      setTracking(true);
    } catch (error) {
      setMessage(`Error: ${error}`);
      console.error(error);
    }
  };

  const handleStopTracking = () => {
    MotionActivityTracker.stopTracking();
    setMessage("Tracking stopped");
    setTracking(false);
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
          {/* Display the latest entry */}
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
                  Timestamp: {new Date(latestActivity.timestamp * 1000).toLocaleString()}
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


```


# Bare React Native Workflow
For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install react-native-device-activity
```
#### Add permissions for Motion & Fitness tracking in your Info.plist:

```
<key>NSMotionUsageDescription</key>
<string>This app uses motion data to track your activity.</string>
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.




## API Reference

### `startTracking(): Promise<string>`
Starts real-time tracking of motion activity. Returns a promise that resolves to the initial motion state.

### `stopTracking(): string`
Stops the real-time motion tracking.

### `addMotionStateChangeListener(listener: (event: MotionStateChangeEvent) => void): Subscription`
Adds a listener to receive updates when the motion state changes.

### `getHistoricalData(startDate: Date, endDate: Date): Promise<HistoricalActivity[]>`
Fetches historical activity data for the given date range.

### `checkMotionActivityAuthStatus(): Promise<MotionActivityAuthStatus>`
Checks the motion activity authorization status. Returns one of the following statuses:

- `NOT_DETERMINED`
- `RESTRICTED`
- `DENIED`
- `AUTHORIZED`

## Contributing

Contributions are welcome!


