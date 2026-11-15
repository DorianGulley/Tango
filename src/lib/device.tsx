import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

const KEY = 'tango.deviceId';
const DeviceIdContext = createContext<string | null>(null);

const storage =
  Platform.OS === 'web'
    ? {
        get: async () => globalThis.localStorage?.getItem(KEY) ?? null,
        set: async (value: string) => globalThis.localStorage?.setItem(KEY, value),
      }
    : {
        get: () => SecureStore.getItemAsync(KEY),
        set: (value: string) =>
          SecureStore.setItemAsync(KEY, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }),
      };

export const readDeviceId = storage.get;

async function loadDeviceId() {
  const existing = await storage.get();
  if (existing) {
    await storage.set(existing);
    return existing;
  }
  const created = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replaceAll('-', '');
  await storage.set(created);
  return created;
}

export type DeviceIdStatus = 'loading' | 'ready' | 'failed';

export function DeviceIdProvider({
  children,
}: {
  children: (status: DeviceIdStatus, retry: () => void) => ReactNode;
}) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    loadDeviceId()
      .then(setDeviceId)
      .catch(() => setFailed(true));
  }, [attempt]);
  const status: DeviceIdStatus = deviceId ? 'ready' : failed ? 'failed' : 'loading';
  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };
  return <DeviceIdContext value={deviceId}>{children(status, retry)}</DeviceIdContext>;
}

export function useDeviceId() {
  const deviceId = use(DeviceIdContext);
  if (!deviceId) throw new Error('useDeviceId called before the device id loaded');
  return deviceId;
}
