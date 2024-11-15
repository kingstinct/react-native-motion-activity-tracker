package expo.modules.motionactivitytracker

import android.app.PendingIntent
import android.content.Context
import androidx.core.content.ContextCompat
import androidx.core.app.ActivityCompat


import android.content.pm.PackageManager
import android.content.Intent
import android.content.IntentFilter
import android.util.Log
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionResult
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.DetectedActivity
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.BroadcastReceiver
import android.Manifest
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.kotlin.Promise
import expo.modules.kotlin.events.EventListener
import android.app.Activity

const val kEventName = "onMotionStateChange"



class MotionActivityTrackerModule : Module() {

  companion object {
    const val REQUEST_CODE_ACTIVITY_RECOGNITION = 1001
  }

  override fun definition() = ModuleDefinition {

    Name("MotionActivityTracker")

    Constants {
      // Check if Google Play Services are available
      val availability = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context)
      val isGooglePlayServicesAvailable = availability == ConnectionResult.SUCCESS
      // val activityPermissionResult = ContextCompat.checkSelfPermission(appContext.reactContext!!, Manifest.permission.ACTIVITY_RECOGNITION)

      // Set the constant
      mapOf(
        "isGooglePlayServicesAvailable" to isGooglePlayServicesAvailable,
        "googlePlayServicesStatus" to availability
        // "activityPermissionResult" to activityPermissionResult
      )
    }

    // Defines event names that the module can send to JavaScript.
    Events(kEventName)

    Function("checkMotionActivityAuthStatus") {
     val status = ContextCompat.checkSelfPermission(
        appContext.currentActivity!!,
        Manifest.permission.ACTIVITY_RECOGNITION
      )
      return@Function when (status) {
        PackageManager.PERMISSION_GRANTED -> 3 
        PackageManager.PERMISSION_DENIED -> 2 
        else -> 2 
      }
    }

    // AsyncFunction("getActivityPermissionResult"){
    //  ActivityCompat.requestPermissions(
    //     appContext.currentActivity!!,
    //     arrayOf(Manifest.permission.ACTIVITY_RECOGNITION),
    //     REQUEST_CODE_ACTIVITY_RECOGNITION
    //   )
    // }

    // AsyncFunction("requestActivityRecognitionPermission") { promise: Promise ->
    //   if (ContextCompat.checkSelfPermission(appContext.currentActivity!!, Manifest.permission.ACTIVITY_RECOGNITION)
    //     != PackageManager.PERMISSION_GRANTED) {

    //     ActivityCompat.requestPermissions(
    //       appContext.currentActivity!!,
    //       arrayOf(Manifest.permission.ACTIVITY_RECOGNITION),
    //       REQUEST_CODE_ACTIVITY_RECOGNITION
    //     )
    //     promise.resolve()
        
    //   } else {
    //     // Permission already granted
    //     promise.resolve()
    //   }
    // }

    Function("startTracking") {
      startActivityTransitionMonitoring()
    } 

    Function("stopTracking") {
      return@Function stopActivityTransitionMonitoring()
    }
  }

  private val context
    get() = requireNotNull(appContext.reactContext)


  private fun startActivityTransitionMonitoring() {
    val transitions = mutableListOf<ActivityTransition>()

    transitions += ActivityTransition.Builder()
      .setActivityType(DetectedActivity.IN_VEHICLE)
      .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
      .build()

    // transitions += ActivityTransition.Builder()
    //   .setActivityType(DetectedActivity.IN_VEHICLE)
    //   .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
    //   .build()

    transitions += ActivityTransition.Builder()
      .setActivityType(DetectedActivity.WALKING)
      .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
      .build()

    // transitions += ActivityTransition.Builder()
    //   .setActivityType(DetectedActivity.WALKING)
    //   .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
    //   .build()

    transitions += ActivityTransition.Builder()
      .setActivityType(DetectedActivity.ON_BICYCLE)
      .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
      .build()

    // transitions += ActivityTransition.Builder()
    //   .setActivityType(DetectedActivity.ON_BICYCLE)
    //   .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
    //   .build()

    transitions += ActivityTransition.Builder()
      .setActivityType(DetectedActivity.RUNNING)
      .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
      .build()

    // transitions += ActivityTransition.Builder()
    //   .setActivityType(DetectedActivity.RUNNING)
    //   .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
    //   .build()

    transitions += ActivityTransition.Builder()
      .setActivityType(DetectedActivity.STILL)
      .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
      .build()

    // transitions += ActivityTransition.Builder()
    //   .setActivityType(DetectedActivity.STILL)
    //   .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
    //   .build()

    val request = ActivityTransitionRequest(transitions)

    val intent = Intent(context, ActivityTransitionReceiver(this)::class.java)
    val pendingIntent = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    val task = ActivityRecognition.getClient(context)
      .requestActivityTransitionUpdates(request, pendingIntent)

    task.addOnSuccessListener {
      Log.i("ExpoSettingsModule", "Started listening for activity transitions.")
    }

    task.addOnFailureListener { e: Exception ->
      Log.e("ExpoSettingsModule", "Failed to start listening for activity transitions.", e)
    }

  }

  private fun stopActivityTransitionMonitoring() {
    Log.i("ExpoSettingsModule", "Stop monitoring")
  }

  fun emitActivityTransitionEvent(activityType: Int) {
    sendEvent(kEventName, mapOf(
        "activityType" to activityType
    ))
  }
}


class ActivityTransitionReceiver(private val module: MotionActivityTrackerModule): BroadcastReceiver() {
  override fun onReceive(context: Context?, intent: Intent) {
    if (ActivityTransitionResult.hasResult(intent)) {
      val result = ActivityTransitionResult.extractResult(intent)!!
      for (event in result.transitionEvents) {
        // Handle the transition event
        module.emitActivityTransitionEvent(event.activityType)
        
        Log.i("ExpoSettingsModule", "Activity: ${event.activityType}, Transition: ${event.transitionType}")
      }
    }
  }
}