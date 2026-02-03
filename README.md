# Entrig

**Push Notifications for Supabase**

Send push notifications to your React Native/Expo app, triggered by database events.

---

## Prerequisites

1. **Create Entrig Account** - Sign up at [entrig.com](https://entrig.com)

2. **Connect Supabase** - Authorize Entrig to access your Supabase project

3. **Upload FCM Service Account** (Android) - Upload Service Account JSON and provide your Application ID

4. **Upload APNs Key** (iOS) - Upload `.p8` key file with Team ID, Bundle ID, and Key ID

---

## Installation

```bash
npm install entrig
```

---

## Platform Setup

### Android

No setup required for Android.

### iOS

Run this command in your project root:

```bash
npx expo prebuild
npx entrig setup ios
```

This automatically configures:
- Entitlements with push notification settings
- Info.plist with background modes

> **Note:** The command creates `.backup` files for safety.

---

## Usage

### Initialize

```typescript
import Entrig from 'entrig';

// Initialize Entrig
await Entrig.init({
  apiKey: 'YOUR_ENTRIG_API_KEY',
});
```

### Register User

```typescript
// Register device for push notifications
await Entrig.register('user-id');
```

### Listen to Notifications

**Foreground notifications** (when app is open):

```typescript
const subscription = Entrig.addListener('onForegroundNotification', (event) => {
  console.log('Notification received:', event.title, event.body);
});

// Don't forget to remove the listener when done
subscription.remove();
```

**Notification tap** (when user taps a notification):

```typescript
const subscription = Entrig.addListener('onNotificationOpened', (event) => {
  // Navigate based on event.data
});
```

**Cold start** (app launched from notification):

```typescript
const initialNotification = await Entrig.getInitialNotification();
if (initialNotification) {
  // Handle the notification that launched the app
}
```

### Unregister

```typescript
await Entrig.unregister();
```

---

## NotificationEvent

- `title` - Notification title
- `body` - Notification body text
- `type` - Optional custom type identifier
- `data` - Optional custom payload data

---

## Support

- Email: team@entrig.com

---
