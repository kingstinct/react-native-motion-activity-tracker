package expo.modules.motionactivitytracker

import android.Manifest
import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.ActivityTransitionResult
import com.google.android.gms.location.DetectedActivity
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

internal const val ACTIVITY_TRANSITION_EVENT = "onMotionStateChange"
internal const val REQUEST_CODE = 1001
internal const val ACTIVITY_TRANSITION_ACTION = "com.motionactivitytracker.ACTIVITY_TRANSITION"
internal const val TAG = "MotionActivityTracker"

class MotionActivityTrackerModule : Module() {

  enum class PermissionStatus {
    AUTHORIZED,
    DENIED,
    NOT_DETERMINED,
    UNAVAILABLE
  }

  enum class TrackingStatus {
    STARTED,
    STOPPED,
    FAILED,
    UNAUTHORIZED
  }

  enum class ActivityType {
    UNKNOWN,
    WALKING,
    RUNNING,
    AUTOMOTIVE,
    STATIONARY,
    CYCLING
  }

  enum class TransitionType {
    ENTER,
    EXIT,
    UNKNOWN
  }

  private lateinit var context: Context

  private val pendingIntent: PendingIntent by lazy {
    val intent = Intent(ACTIVITY_TRANSITION_ACTION)
        .setPackage(context.packageName)

    PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
      } else {
          PendingIntent.FLAG_UPDATE_CURRENT
      }
    )
  }

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (ActivityTransitionResult.hasResult(intent)) {
        val result = ActivityTransitionResult.extractResult(intent)!!

        for (event in result.transitionEvents) {
          val activityType = when(event.activityType) {
            DetectedActivity.IN_VEHICLE -> ActivityType.AUTOMOTIVE
            DetectedActivity.WALKING -> ActivityType.WALKING
            DetectedActivity.RUNNING -> ActivityType.RUNNING
            DetectedActivity.ON_BICYCLE -> ActivityType.CYCLING
            DetectedActivity.STILL -> ActivityType.STATIONARY
            else -> ActivityType.UNKNOWN
          }

          val transitionType = when(event.transitionType) {
            ActivityTransition.ACTIVITY_TRANSITION_ENTER -> TransitionType.ENTER
            ActivityTransition.ACTIVITY_TRANSITION_EXIT -> TransitionType.EXIT
            else -> TransitionType.UNKNOWN
          }

          sendEvent(ACTIVITY_TRANSITION_EVENT,
            mapOf(
              "state" to activityType,
              "transitionType" to transitionType
            )
          )
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MotionActivityTracker")

    OnCreate {
      context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      registerReceiver()
    }

    OnDestroy {
      unregisterReceiver()
    }

    OnActivityEntersForeground {
      registerReceiver()
    }

    OnActivityEntersBackground {
      unregisterReceiver()
    }

    Constants{
      val availability = GoogleApiAvailability.getInstance()
        .isGooglePlayServicesAvailable(appContext.reactContext!!)
      val isGooglePlayServicesAvailable = availability == ConnectionResult.SUCCESS

      mapOf(
        "isGooglePlayServicesAvailable" to isGooglePlayServicesAvailable,
      )
    }

    Events(ACTIVITY_TRANSITION_EVENT)

    AsyncFunction("getPermissionStatus") {
      val status = checkPermissions()

      return@AsyncFunction when (status) {
          PackageManager.PERMISSION_GRANTED -> PermissionStatus.AUTHORIZED
          PackageManager.PERMISSION_DENIED -> PermissionStatus.DENIED
          4 -> PermissionStatus.UNAVAILABLE
          else -> PermissionStatus.NOT_DETERMINED
      }
    }

    AsyncFunction("startTracking") Coroutine  { ->
      return@Coroutine startActivityTransitionMonitoring()
    }

    AsyncFunction("stopTracking") Coroutine  { ->
      return@Coroutine stopActivityTransitionMonitoring()
    }

    Function("simulateActivityTransition") { activityType: String, transitionType: String ->
      sendEvent(ACTIVITY_TRANSITION_EVENT, mapOf (
        "activityType" to activityType,
        "transitionType" to transitionType
      ))
    }
  }

  // CHECK PERMISSIONS
  // API v.29 is required for ACTIVITY_RECOGNITION
  private fun checkPermissions(): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      return  ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACTIVITY_RECOGNITION
      )
    }
    return 4
  }

  // REGISTER RECEIVER
  @SuppressLint("UnspecifiedRegisterReceiverFlag")
  private fun registerReceiver() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(
        receiver,
        IntentFilter(ACTIVITY_TRANSITION_ACTION),
        Context.RECEIVER_NOT_EXPORTED
      )
    } else {
      context.registerReceiver(
        receiver,
        IntentFilter(ACTIVITY_TRANSITION_ACTION),
      )
    }
  }

  private fun unregisterReceiver() {
    context.unregisterReceiver(receiver)
  }

  // START/STOP MONITORING
  private suspend fun startActivityTransitionMonitoring(): TrackingStatus {
    if (ActivityCompat.checkSelfPermission(
        context,
        Manifest.permission.ACTIVITY_RECOGNITION
      ) != PackageManager.PERMISSION_GRANTED
    ) {
      return TrackingStatus.UNAUTHORIZED
    }

    val transitions = mutableListOf<ActivityTransition>()

    val activities = listOf(
      DetectedActivity.IN_VEHICLE,
      DetectedActivity.WALKING,
      DetectedActivity.ON_BICYCLE,
      DetectedActivity.RUNNING,
      DetectedActivity.STILL
    )

    activities.forEach { activityType ->
      transitions.add(
        ActivityTransition.Builder()
          .setActivityType(activityType)
          .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
          .build()
      )
      transitions.add(
        ActivityTransition.Builder()
          .setActivityType(activityType)
          .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
          .build()
      )
    }

    val request = ActivityTransitionRequest(transitions)

    return suspendCoroutine { continuation ->
      ActivityRecognition.getClient(context)
        .requestActivityTransitionUpdates(request, pendingIntent)
        .addOnSuccessListener {
          Log.i(TAG, "Successfully registered for activity transitions")
          continuation.resume(TrackingStatus.STARTED)
        }
        .addOnFailureListener { e ->
          Log.e(TAG, "Failed to register for activity transitions", e)
          continuation.resume(TrackingStatus.FAILED)
        }
    }
  }

  private suspend fun stopActivityTransitionMonitoring(): TrackingStatus {

    if (ActivityCompat.checkSelfPermission(
          context,
          Manifest.permission.ACTIVITY_RECOGNITION
        ) != PackageManager.PERMISSION_GRANTED
    ) {
      return TrackingStatus.UNAUTHORIZED
    }

    return suspendCoroutine { continuation ->
    ActivityRecognition.getClient(context)
      .removeActivityTransitionUpdates(pendingIntent)
      .addOnSuccessListener {
        Log.i(TAG, "Successfully deregistered from activity transitions")
        continuation.resume(TrackingStatus.STOPPED)
      }
      .addOnFailureListener { e ->
        Log.e(TAG, "Failed to deregister from activity transitions", e)
        continuation.resume(TrackingStatus.FAILED)
      }
    }
  }
}
