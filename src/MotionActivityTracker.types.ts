export type HistoricalActivity = {
  walking: boolean;
  running: boolean;
  automotive: boolean;
  stationary: boolean;
  cycling: boolean;
  unknown: boolean;
  timestamp: number;
  confidence: Confidence;
};

export enum Confidence {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  UNKNOWN = "UNKNOWN",
}

export enum ActivityType {
  UNKNOWN = "UNKNOWN",
  WALKING = "WALKING",
  RUNNING = "RUNNING",
  AUTOMOTIVE = "AUTOMOTIVE",
  STATIONARY = "STATIONARY",
  CYCLING = "CYCLING",
}

export enum TransitionType {
  ENTER = "ENTER",
  EXIT = "EXIT",
}

export enum PermissionStatus {
  NOT_DETERMINED = "NOT_DETERMINED",
  RESTRICTED = "RESTRICTED",
  DENIED = "DENIED",
  AUTHORIZED = "AUTHORIZED",
  UNAVAILABLE = "UNAVAILABLE",
  PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED",
}

export enum TrackingStatus {
  STARTED = "STARTED",
  STOPPED = "STOPPED",
  FAILED = "FAILED",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export type ActivityChangeEvent = {
  activityType: ActivityType;
  transitionType: TransitionType;
  confidence: Confidence;
  timestamp: number;
};
