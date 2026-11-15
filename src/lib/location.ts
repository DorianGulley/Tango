import * as Location from 'expo-location';

import { SERVICE_RADIUS_METERS, SF_CENTER } from '@/../convex/tangoConfig';

type Position = { latitude: number; longitude: number };

function parseDemoLocation(): Position | null {
  const [latitude, longitude] = (process.env.EXPO_PUBLIC_DEMO_LOCATION ?? '').split(',').map(Number);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function distanceMeters(a: Position, b: Position) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(toRad(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

async function currentPosition(): Promise<Position | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
  const fix = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    .then((p) => p.coords)
    .catch(() => null);
  return (await Promise.race([fix, timeout])) ?? (await Location.getLastKnownPositionAsync())?.coords ?? null;
}

export type PositionResult =
  | { ok: true; position: Position; demo: boolean }
  | { ok: false; message: string };

export async function getPositionForTango(): Promise<PositionResult> {
  const demo = parseDemoLocation();
  const { granted } = await Location.requestForegroundPermissionsAsync();
  const position = granted ? await currentPosition() : null;
  const inSanFrancisco = position && distanceMeters(position, SF_CENTER) <= SERVICE_RADIUS_METERS;

  if (position && inSanFrancisco) return { ok: true, position, demo: false };
  if (demo) return { ok: true, position: demo, demo: true };
  if (!granted) {
    return { ok: false, message: 'Tango Mode needs your location while it is on. You can allow it in Settings.' };
  }
  if (!position) return { ok: false, message: 'We could not find your location. Try again in a moment.' };
  return { ok: false, message: 'Tango is only available in San Francisco for now.' };
}

export const isDemoLocationEnabled = parseDemoLocation() !== null;
