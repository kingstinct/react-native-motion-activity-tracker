import * as React from 'react';

import { MotionActivityTrackerViewProps } from './MotionActivityTracker.types';

export default function MotionActivityTrackerView(props: MotionActivityTrackerViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
