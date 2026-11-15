import '@/lib/background-location';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Body, Button, Screen, Title } from '@/components/ui';
import { DeviceIdProvider, type DeviceIdStatus } from '@/lib/device';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

function AppStack({ status, retry }: { status: DeviceIdStatus; retry: () => void }) {
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);
  if (status === 'loading') return null;
  if (status === 'failed') {
    return (
      <Screen>
        <Title>Tango couldn&apos;t start</Title>
        <Body muted>We couldn&apos;t open this device&apos;s secure storage.</Body>
        <Button label="Try again" onPress={retry} />
      </Screen>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="places" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <StatusBar style="dark" />
      <DeviceIdProvider>{(status, retry) => <AppStack status={status} retry={retry} />}</DeviceIdProvider>
    </ConvexProvider>
  );
}
