import { StyleSheet, Text, View } from 'react-native';

import * as MotionActivityTracker from 'motion-activity-tracker';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>{MotionActivityTracker.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
