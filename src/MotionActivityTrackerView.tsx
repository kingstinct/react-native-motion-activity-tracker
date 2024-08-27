import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { MotionActivityTrackerViewProps } from './MotionActivityTracker.types';

const NativeView: React.ComponentType<MotionActivityTrackerViewProps> =
  requireNativeViewManager('MotionActivityTracker');

export default function MotionActivityTrackerView(props: MotionActivityTrackerViewProps) {
  return <NativeView {...props} />;
}
