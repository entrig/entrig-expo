import ExpoModulesCore
import UserNotifications
import EntrigSDK

public class EntrigModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Entrig")

    // Defines event names that the module can send to JavaScript.
    Events("onForegroundNotification", "onNotificationOpened")

    // Initialize SDK
    AsyncFunction("init") { (config: [String: Any]) -> Void in
      guard let apiKey = config["apiKey"] as? String, !apiKey.isEmpty else {
        throw Exception(name: "INVALID_API_KEY", description: "API key is required and cannot be empty")
      }

      let handlePermission = config["handlePermission"] as? Bool ?? true
      let entrigConfig = EntrigConfig(apiKey: apiKey, handlePermission: handlePermission)

      // Set up SDK listeners
      Entrig.setOnForegroundNotificationListener(self)
      Entrig.setOnNotificationOpenedListener(self)

      return try await withCheckedThrowingContinuation { continuation in
        Entrig.configure(config: entrigConfig) { success, error in
          if success {
            continuation.resume()
          } else {
            continuation.resume(throwing: Exception(name: "INIT_ERROR", description: error ?? "Failed to initialize SDK"))
          }
        }
      }
    }

    // Register user
    AsyncFunction("register") { (userId: String) -> Void in
      return try await withCheckedThrowingContinuation { continuation in
        Entrig.register(userId: userId, sdk: "expo") { success, error in
          if success {
            continuation.resume()
          } else {
            continuation.resume(throwing: Exception(name: "REGISTER_ERROR", description: error ?? "Registration failed"))
          }
        }
      }
    }

    // Request permission
    AsyncFunction("requestPermission") { () -> Bool in
      return try await withCheckedThrowingContinuation { continuation in
        Entrig.requestPermission { granted, error in
          if let error = error {
            continuation.resume(throwing: Exception(name: "PERMISSION_ERROR", description: error.localizedDescription))
          } else {
            continuation.resume(returning: granted)
          }
        }
      }
    }

    // Unregister
    AsyncFunction("unregister") { () -> Void in
      return try await withCheckedThrowingContinuation { continuation in
        Entrig.unregister { success, error in
          if success {
            continuation.resume()
          } else {
            continuation.resume(throwing: Exception(name: "UNREGISTER_ERROR", description: error ?? "Unregistration failed"))
          }
        }
      }
    }

    // Get initial notification
    AsyncFunction("getInitialNotification") { () -> [String: Any]? in
      if let event = Entrig.getInitialNotification() {
        return [
          "title": event.title ?? "",
          "body": event.body ?? "",
          "data": event.data ?? [:],
          "isForeground": false
        ]
      }
      return nil
    }
  }

  // Helper method to send notification events to JavaScript
  private func sendNotificationToJS(event: NotificationEvent, isForeground: Bool) {
    let payload: [String: Any] = [
      "title": event.title ?? "",
      "body": event.body ?? "",
      "data": event.data ?? [:],
      "isForeground": isForeground
    ]

    if isForeground {
      sendEvent("onForegroundNotification", payload)
    } else {
      sendEvent("onNotificationOpened", payload)
    }
  }
}

// MARK: - SDK Listeners
extension EntrigModule: OnNotificationReceivedListener {
  public func onNotificationReceived(_ event: NotificationEvent) {
    sendNotificationToJS(event: event, isForeground: true)
  }
}

extension EntrigModule: OnNotificationClickListener {
  public func onNotificationClick(_ event: NotificationEvent) {
    sendNotificationToJS(event: event, isForeground: false)
  }
}
