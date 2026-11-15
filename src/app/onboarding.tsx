import { useQuery } from 'convex/react';
import { ActivityIndicator, View } from 'react-native';

import { api } from '@/../convex/_generated/api';
import { ProfileForm } from '@/components/profile-form';
import { useDeviceId } from '@/lib/device';
import { colors } from '@/theme';

export default function OnboardingScreen() {
  const deviceId = useDeviceId();
  const state = useQuery(api.tango.state, { deviceId });
  if (state === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <ProfileForm initial={state?.profile ?? null} />;
}
