import CoreMotion
import ExpoModulesCore


public class MotionActivityTrackerModule: Module {
  private let motionActivityManager = CMMotionActivityManager()
  private var hasListeners = false

    public func definition() -> ModuleDefinition {
        Name("MotionActivityTracker")
        
        // Define the event that can be emitted
        Events("onMotionStateChange")
        
        // Check permissions
        AsyncFunction("getPermissionStatus") { (promise: Promise) in
            guard CMMotionActivityManager.isActivityAvailable() else {
                // Motion activity is not available
                promise.resolve("UNAVAILABLE")
                return
            }

            // Map the authorization status to a string
            let authStatus = CMMotionActivityManager.authorizationStatus()
            switch authStatus {
            case .notDetermined:
                promise.resolve("NOT_DETERMINED")
            case .restricted:
                promise.resolve("RESTRICTED")
            case .denied:
                promise.resolve("DENIED")
            case .authorized:
                promise.resolve("AUTHORIZED")
            @unknown default:
                promise.reject("E_UNKNOWN_STATUS", "Unknown authorization status")
            }
        }

    // Get historical data query
    AsyncFunction("getHistoricalData") { (startDate: Date, endDate: Date, promise: Promise) in
      // Ensure activity tracking is available
      guard CMMotionActivityManager.isActivityAvailable() else {
        promise.reject("E_ACTIVITY_NOT_AVAILABLE", "Motion activity tracking is not available on this device")
        return
      }

      // Query for historical motion data
      self.motionActivityManager.queryActivityStarting(from: startDate, to: endDate, to: OperationQueue.main) { activities, error in
        if let error = error {
          promise.reject("E_QUERY_FAILED", error.localizedDescription)
          return
        }

        guard let activities = activities else {
          promise.resolve([])
          return
        }

        // Map activities to a dictionary format for JavaScript
        let activityData = activities.map { activity -> MotionActivity in
            return MotionActivity(
                   walking: activity.walking,
                   running: activity.running,
                   automotive: activity.automotive,
                   stationary: activity.stationary,
                   cycling: activity.cycling,
                   unknown: activity.unknown,
                   confidence: activity.confidence.rawValue,
                   timestamp: activity.startDate.timeIntervalSince1970
               )
        }
        let activityDictionaries = activityData.map { $0.toDictionary() }
        promise.resolve(activityDictionaries)
      }
    }

    // Define the startTracking function
        AsyncFunction("startTracking") { (promise: Promise) in
            hasListeners = true
            // Ensure activity tracking is available
            guard CMMotionActivityManager.isActivityAvailable() else {
                promise.reject("E_ACTIVITY_NOT_AVAILABLE", "Motion activity tracking is not available on this device")
                return
            }
            
            // Use a flag to ensure the promise is resolved only once
            var isPromiseResolved = false
            
            // Start activity updates
            self.motionActivityManager.startActivityUpdates(to: OperationQueue.main) { activity in
                guard let activity = activity else {
                    // If no activity, resolve with a message
                    if !isPromiseResolved {
                        promise.resolve("no activity detected")
                        isPromiseResolved = true
                    }
                    return
                }
                
                var state = "unknown"
                if activity.walking {
                    state = "walking"
                } else if activity.running {
                    state = "running"
                } else if activity.automotive {
                    state = "automotive"
                } else if activity.stationary {
                    state = "stationary"
                }
                
                let timestamp = activity.startDate.timeIntervalSince1970
                let confidence = activity.confidence.rawValue
                
                // Emit the state change event continuously as long as listeners exist
                if self.hasListeners {
                    print("Emitting onMotionStateChange event with state: \(state), confidence: \(confidence), timestamp: \(timestamp)")
                    self.sendEvent("onMotionStateChange", [
                        "state": state,
                        "confidence": confidence,
                        "timestamp": timestamp,
                        "transitionType": "ENTER",
                    ])
                }
                
                // Resolve the promise only once with the initial state
                if !isPromiseResolved {
                    promise.resolve(state)
                    isPromiseResolved = true
                }
            }
        }
        
        Function("simulateActivityTransition") { (activityType: String, transitionType: String, timestamp: Double?, confidence: Int?) in
            // Map activityType to activity states
            let isWalking = (activityType == "walking")
            let isRunning = (activityType == "running")
            let isAutomotive = (activityType == "automotive")
            let isStationary = (activityType == "stationary")
            let isCycling = (activityType == "cycling")
            let isUnknown = (activityType == "unknown")
            
            let confidenceLevel = confidence ?? 1 // Default to medium confidence if not provided
            let eventTimestamp = timestamp ?? Date().timeIntervalSince1970
            
            // Create a MotionActivity instance
            let simulatedActivity = MotionActivity(
                walking: isWalking,
                running: isRunning,
                automotive: isAutomotive,
                stationary: isStationary,
                cycling: isCycling,
                unknown: isUnknown,
                confidence: confidenceLevel,
                timestamp: eventTimestamp
            )
            
            // Convert to dictionary
            let simulatedEvent = simulatedActivity.toDictionary()
            
            if self.hasListeners {
                print("Simulating activity transition with event: \(simulatedEvent)")
                self.sendEvent("onMotionStateChange", simulatedEvent)
            }
            
            return "Simulated activity transition emitted"
        }


    // Define the stopTracking function
    Function("stopTracking") {
      self.motionActivityManager.stopActivityUpdates()
      return "Tracking stopped"
    }
  }

  // Listener management
  public func addListener(eventName: String) {
    if eventName == "onMotionStateChange" {
      hasListeners = true
    }
  }

  public func removeListeners(count: Int) {
    if count == 0 {
      hasListeners = false
    }
  }
}
