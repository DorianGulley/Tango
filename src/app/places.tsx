import { useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { api } from '@/../convex/_generated/api';
import { ENVIRONMENTS, type Environment } from '@/../convex/tangoConfig';
import { Body, Button, Card, Chip, ChipRow, Heading, Screen, Title } from '@/components/ui';
import { useDeviceId } from '@/lib/device';
import { showError } from '@/lib/errors';
import { radius } from '@/theme';

export default function PlacesScreen() {
  const deviceId = useDeviceId();
  const state = useQuery(api.tango.state, { deviceId });
  const locations = useQuery(api.locations.list);
  const saveProfile = useMutation(api.users.saveProfile);
  const profile = state?.profile;

  async function toggle(id: Environment) {
    if (!profile) return;
    const environments = profile.environments.includes(id)
      ? profile.environments.filter((e) => e !== id)
      : [...profile.environments, id];
    try {
      if (!profile.email) return;
      await saveProfile({ deviceId, ...profile, email: profile.email, bio: profile.bio ?? undefined, environments });
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Screen>
      <Title>Places</Title>
      <Body muted>
        Tango only suggests these curated public spots on campus. Your choices filter the list; they never
        add new places.
      </Body>
      {profile && (
        <ChipRow>
          {ENVIRONMENTS.map((e) => (
            <Chip
              key={e.id}
              testID={`places-env-${e.id}`}
              label={e.label}
              selected={profile.environments.includes(e.id)}
              onPress={() => toggle(e.id)}
            />
          ))}
        </ChipRow>
      )}
      <Heading>Rendezvous points</Heading>
      {locations?.map((location) => {
        const included = profile?.environments.includes(location.type) ?? true;
        return (
          <Card key={location._id} style={!included && { opacity: 0.4 }}>
            <View style={styles.row}>
              <Image source={{ uri: location.photoUrl }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1, gap: 2 }}>
                <Body style={{ fontWeight: '700' }}>{location.name}</Body>
                <Body muted>
                  {ENVIRONMENTS.find((e) => e.id === location.type)?.label} · {location.neighborhood}
                </Body>
              </View>
            </View>
          </Card>
        );
      })}
      <Button label="Done" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.sm },
});
