import { ConvexHttpClient } from 'convex/browser';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { api } from '@/../convex/_generated/api';
import { readDeviceId } from '@/lib/device';
import { campusOrDemo } from '@/lib/location';

const TASK = 'tango-location';
const NOTIFIED_KEY = 'tango.notifiedInvitation';
const supported = Platform.OS !== 'web';

async function notifyInvitation(invitationId: string) {
  if (AppState.currentState === 'active') return;
  if ((await SecureStore.getItemAsync(NOTIFIED_KEY)) === invitationId) return;
  await SecureStore.setItemAsync(NOTIFIED_KEY, invitationId, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'You have a Tango invitation',
      body: 'Someone nearby fits. Open Tango in the next few minutes to accept.',
    },
    trigger: null,
  });
}

const client = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

if (supported) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK, async ({ data, error }) => {
    const latest = data?.locations.at(-1);
    if (error || !latest) return;
    const deviceId = await readDeviceId();
    if (!deviceId) return;
    const position = campusOrDemo(latest.coords) ?? latest.coords;
    const result = await client.mutation(api.tango.reportLocation, {
      deviceId,
      latitude: position.latitude,
      longitude: position.longitude,
    });
    if (!result.active) {
      await Location.stopLocationUpdatesAsync(TASK);
      return;
    }
    if (result.invitation) await notifyInvitation(result.invitation.id);
  });
}

export async function startBackgroundUpdates() {
  if (!supported) return false;
  const { granted } = await Location.requestBackgroundPermissionsAsync();
  if (!granted) return false;
  await Notifications.requestPermissionsAsync();
  if (!(await Location.hasStartedLocationUpdatesAsync(TASK))) {
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 25,
      deferredUpdatesInterval: 60_000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: 'Tango Mode is on',
        notificationBody: 'Looking for someone near a meetup spot. Turn Tango Mode off to stop.',
      },
    });
  }
  return true;
}

export async function watchWhileOpen(deviceId: string) {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 60_000 },
    ({ coords }) => {
      const position = campusOrDemo(coords) ?? coords;
      client
        .mutation(api.tango.reportLocation, { deviceId, latitude: position.latitude, longitude: position.longitude })
        .catch(() => {});
    },
  );
  return () => subscription.remove();
}

export async function stopBackgroundUpdates() {
  if (supported && (await Location.hasStartedLocationUpdatesAsync(TASK))) {
    await Location.stopLocationUpdatesAsync(TASK);
  }
}
