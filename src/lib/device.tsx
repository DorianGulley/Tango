import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

const KEY = 'tango.deviceId';
const DeviceIdContext = createContext<string | null>(null);

async function loadDeviceId() {
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing) return existing;
  const created = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replaceAll('-', '');
  await SecureStore.setItemAsync(KEY, created);
  return created;
}

export function DeviceIdProvider({ children }: { children: (ready: boolean) => ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  useEffect(() => {
    loadDeviceId().then(setDeviceId);
  }, []);
  return <DeviceIdContext value={deviceId}>{children(deviceId !== null)}</DeviceIdContext>;
}

export function useDeviceId() {
  const deviceId = use(DeviceIdContext);
  if (!deviceId) throw new Error('useDeviceId called before the device id loaded');
  return deviceId;
}
