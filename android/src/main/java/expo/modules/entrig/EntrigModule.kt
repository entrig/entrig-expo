package expo.modules.entrig

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.entrig.sdk.Entrig
import com.entrig.sdk.models.EntrigConfig
import com.entrig.sdk.models.NotificationEvent

class EntrigModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is null")

  private val currentActivity: Activity?
    get() = appContext.currentActivity

  override fun definition() = ModuleDefinition {
    Name("Entrig")

    // Defines event names that the module can send to JavaScript.
    Events("onForegroundNotification", "onNotificationOpened")

    OnCreate {
      // Set up SDK listeners when module is created
      Entrig.setOnForegroundNotificationListener { notification ->
        Log.d("EntrigModule", "Foreground notification: ${notification.toMap()}")
        sendEvent("onForegroundNotification", notification.toMap())
      }

      Entrig.setOnNotificationOpenedListener { notification ->
        Log.d("EntrigModule", "Notification opened: ${notification.toMap()}")
        sendEvent("onNotificationOpened", notification.toMap())
      }
    }

    // Initialize SDK
    AsyncFunction("init") { config: Map<String, Any?>, promise: Promise ->
      val apiKey = config["apiKey"] as? String
      if (apiKey.isNullOrEmpty()) {
        promise.reject("INVALID_API_KEY", "API key is required and cannot be empty", null)
        return@AsyncFunction
      }

      val handlePermission = config["handlePermission"] as? Boolean ?: true
      val entrigConfig = EntrigConfig(
        apiKey = apiKey,
        handlePermission = handlePermission
      )

      // Pass application context to ensure lifecycle callbacks are registered
      val appContext = context.applicationContext
      Entrig.initialize(appContext, entrigConfig) { success, error ->
        if (success) {
          promise.resolve(null)
        } else {
          promise.reject("INIT_ERROR", error ?: "Failed to initialize SDK", null)
        }
      }
    }

    // Register user
    AsyncFunction("register") { userId: String, promise: Promise ->
      val activity = currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }

      Entrig.register(userId, activity) { success, error ->
        if (success) {
          promise.resolve(null)
        } else {
          promise.reject("REGISTER_ERROR", error ?: "Registration failed", null)
        }
      }
    }

    // Request permission
    AsyncFunction("requestPermission") { promise: Promise ->
      val activity = currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }

      Entrig.requestPermission(activity) { granted ->
        promise.resolve(granted)
      }
    }

    // Unregister
    AsyncFunction("unregister") { promise: Promise ->
      Entrig.unregister { success, error ->
        if (success) {
          promise.resolve(null)
        } else {
          promise.reject("UNREGISTER_ERROR", error ?: "Unregistration failed", null)
        }
      }
    }

    // Get initial notification
    AsyncFunction("getInitialNotification") { promise: Promise ->
      val initialNotification = Entrig.getInitialNotification()
      promise.resolve(initialNotification?.toMap())
    }
  }
}
