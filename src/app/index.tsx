import { useMutation, useQuery } from 'convex/react';
import { Redirect, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { api } from '@/../convex/_generated/api';
import { ITEMS } from '@/../convex/compatibility';
import { CAMPUS_NAME, ENVIRONMENTS } from '@/../convex/tangoConfig';
import { MatchFlow } from '@/components/match-flow';
import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { startBackgroundUpdates, stopBackgroundUpdates, watchWhileOpen } from '@/lib/background-location';
import { useDeviceId } from '@/lib/device';
import { showError } from '@/lib/errors';
import type { TangoState } from '@/lib/types';
import { getPositionForTango } from '@/lib/location';
import { colors, space } from '@/theme';

function intentLabel(value: string | number | undefined) {
  const item = ITEMS.find((i) => i.id === 'intent');
  if (item?.kind !== 'choice') return null;
  return item.options.find((o) => o.value === value)?.label ?? null;
}

export default function HomeScreen() {
  const deviceId = useDeviceId();
  const state = useQuery(api.tango.state, { deviceId });

  if (state === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (state === null || !state.profile.email || !state.profile.quiz) return <Redirect href="/onboarding" />;
  if (state.match) return <MatchFlow match={state.match} />;
  return <TangoHome profile={state.profile} tangoMode={state.tangoMode} connections={state.connections} />;
}

type HomeProps = Pick<TangoState, 'profile' | 'tangoMode' | 'connections'>;

function TangoHome({ profile, tangoMode, connections }: HomeProps) {
  const deviceId = useDeviceId();
  const setTangoMode = useMutation(api.tango.setTangoMode);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const on = tangoMode !== null;

  useEffect(() => {
    if (!on) {
      stopBackgroundUpdates().catch(() => {});
      return;
    }
    let stopWatching: (() => void) | undefined;
    let cancelled = false;
    startBackgroundUpdates()
      .then(async (background) => {
        if (background || cancelled) return;
        setNotice('Tango only finds you while the app is open. To be paired with it closed, set location to "Always" in Settings.');
        stopWatching = await watchWhileOpen(deviceId);
        if (cancelled) stopWatching();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      stopWatching?.();
    };
  }, [on, deviceId]);

  async function turnOn() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await getPositionForTango();
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      if (result.demo) setNotice('Demo build: using a fixed spot on campus.');
      await setTangoMode({ deviceId, on: true, ...result.position });
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      await setTangoMode({ deviceId, on: false });
      await stopBackgroundUpdates();
      setNotice(null);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  const places = ENVIRONMENTS.filter((e) => profile.environments.includes(e.id))
    .map((e) => e.label)
    .join(', ');

  return (
    <Screen>
      <Title testID="home-greeting">Hi, {profile.name}</Title>
      <Card>
        <Body testID="profile-summary">
          {profile.age} · {intentLabel(profile.quiz?.intent)}
        </Body>
        <Body muted testID="profile-places">
          Meets at: {places}
        </Body>
        <View style={styles.links}>
          <Button
            testID="button-edit-profile"
            label="Edit profile"
            variant="secondary"
            style={styles.flex}
            onPress={() => router.push('/onboarding')}
          />
          <Button
            testID="button-places"
            label="Places"
            variant="secondary"
            style={styles.flex}
            onPress={() => router.push('/places')}
          />
        </View>
      </Card>

      {connections.length > 0 && (
        <Card>
          <Body style={{ fontWeight: '700' }}>It&apos;s mutual</Body>
          {connections.map((c) => (
            <Body key={c.matchId} testID="connection">
              Your Tango at {c.placeName}:{' '}
              {c.theirContact ?? 'no contact shared (share yours next time to see theirs)'}
            </Body>
          ))}
        </Card>
      )}

      <View style={styles.hero}>
        <SymbolView
          name={
            tangoMode
              ? { ios: 'dot.radiowaves.left.and.right', android: 'sensors', web: 'sensors' }
              : { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }
          }
          size={72}
          tintColor={tangoMode ? colors.accent : colors.muted}
          animationSpec={tangoMode ? { effect: { type: 'pulse' }, repeating: true } : undefined}
        />
        {tangoMode ? (
          <>
            <Title style={styles.centerText} testID="tango-mode-on">
              Tango Mode is on
            </Title>
            <Body muted style={styles.centerText}>
              We&apos;re looking for someone nearby who fits, even while Tango is closed. We&apos;ll
              notify you when there&apos;s an invitation. Your location is never shown to anyone.
            </Body>
            {!tangoMode.located && (
              <Body style={styles.centerText}>We&apos;ll start looking once you&apos;re on the {CAMPUS_NAME} campus.</Body>
            )}
          </>
        ) : (
          <>
            <Title style={styles.centerText}>Ready to Tango?</Title>
            <Body muted style={styles.centerText}>
              Turn on Tango Mode to be introduced to someone nearby at a public spot. It stays on until
              you turn it off.
            </Body>
          </>
        )}
        {notice && (
          <Body testID="location-notice" style={[styles.centerText, { color: colors.muted }]}>
            {notice}
          </Body>
        )}
      </View>

      {tangoMode ? (
        <Button
          testID="button-tango-off"
          label="Turn off Tango Mode"
          variant="secondary"
          busy={busy}
          onPress={turnOff}
        />
      ) : (
        <Button testID="button-tango-on" label="Turn on Tango Mode" busy={busy} onPress={turnOn} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerText: { textAlign: 'center' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.xl },
  links: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  flex: { flex: 1 },
});
