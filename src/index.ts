import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to MotionActivityTracker.web.ts
// and on native platforms to MotionActivityTracker.ts
import MotionActivityTrackerModule from './MotionActivityTrackerModule';
import MotionActivityTrackerView from './MotionActivityTrackerView';
import { ChangeEventPayload, MotionActivityTrackerViewProps } from './MotionActivityTracker.types';

// Get the native constant value.
export const PI = MotionActivityTrackerModule.PI;

export function hello(): string {
  return MotionActivityTrackerModule.hello();
}

export async function setValueAsync(value: string) {
  return await MotionActivityTrackerModule.setValueAsync(value);
}

const emitter = new EventEmitter(MotionActivityTrackerModule ?? NativeModulesProxy.MotionActivityTracker);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { MotionActivityTrackerView, MotionActivityTrackerViewProps, ChangeEventPayload };
