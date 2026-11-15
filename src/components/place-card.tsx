import { Image } from 'expo-image';
import { AppleMaps } from 'expo-maps';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { ENVIRONMENTS } from '@/../convex/tangoConfig';
import { Body, Button, Card, Title } from '@/components/ui';
import { colors, radius, space } from '@/theme';

export type Place = {
  name: string;
  type: string;
  neighborhood: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  photoCredit: string;
};

export function openDirections(place: Place) {
  const query = encodeURIComponent(place.name);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${place.latitude},${place.longitude}&q=${query}&dirflg=w`
      : `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=walking`;
  Linking.openURL(url);
}

export function PlaceCard({ place, compact }: { place: Place; compact?: boolean }) {
  const coordinates = { latitude: place.latitude, longitude: place.longitude };
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {!compact && (
        <View>
          <Image source={{ uri: place.photoUrl }} style={styles.photo} contentFit="cover" transition={200} />
          <Body style={styles.credit}>Photo: {place.photoCredit} · Wikimedia Commons</Body>
        </View>
      )}
      <View style={styles.body}>
        <Body muted>
          {ENVIRONMENTS.find((e) => e.id === place.type)?.label} · {place.neighborhood}
        </Body>
        <Title testID="place-name" style={{ fontSize: 24 }}>
          {place.name}
        </Title>
        <Body>{place.description}</Body>
      </View>
      {Platform.OS === 'ios' && (
        <AppleMaps.View
          style={compact ? styles.mapCompact : styles.map}
          cameraPosition={{ coordinates, zoom: 15 }}
          markers={[{ coordinates, title: place.name, tintColor: colors.accent }]}
          uiSettings={{ myLocationButtonEnabled: false }}
        />
      )}
      <View style={styles.body}>
        <Button
          testID="button-directions"
          label="Open in Maps"
          variant="secondary"
          onPress={() => openDirections(place)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.border },
  credit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: 10,
    lineHeight: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    borderTopLeftRadius: radius.sm,
  },
  body: { padding: space.md, gap: space.xs },
  map: { width: '100%', height: 180 },
  mapCompact: { width: '100%', height: 140 },
});
