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
        AsyncFunction("checkMotionActivityAuthStatus") { (promise: Promise) in
            guard CMMotionActivityManager.isActivityAvailable() else {
                // Motion activity is not available on this device
                promise.resolve(CMAuthorizationStatus.denied.rawValue)
                return
            }

            // Check the current authorization status directly
            let authStatus = CMMotionActivityManager.authorizationStatus()
              switch authStatus {
              case .notDetermined, .restricted, .denied, .authorized:
                  promise.resolve(authStatus.rawValue)
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

        // Emit the state change event continuously as long as listeners exist
        if self.hasListeners {
          print("Emitting onMotionStateChange event with state: \(state)")
          self.sendEvent("onMotionStateChange", [
            "state": state
          ])
        }
        
        // Resolve the promise only once with the initial state
        if !isPromiseResolved {
          promise.resolve(state)
          isPromiseResolved = true
        }
      }
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