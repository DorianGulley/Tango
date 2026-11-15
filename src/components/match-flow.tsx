import { useMutation } from 'convex/react';
import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/../convex/_generated/api';
import { FEELINGS, REPORT_REASONS, RENDEZVOUS_MINUTES, type Feeling, type ReportReason } from '@/../convex/tangoConfig';
import { PlaceCard } from '@/components/place-card';
import { Body, Button, Card, Chip, ChipRow, Heading, Screen, Title } from '@/components/ui';
import { useDeviceId } from '@/lib/device';
import { showError } from '@/lib/errors';
import type { MatchView } from '@/lib/types';
import { formatRemaining, useNow } from '@/lib/use-now';
import { colors, radius, space } from '@/theme';

function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    try {
      await action();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(null);
    }
  }
  return { busy, run };
}

function Countdown({ deadline, label }: { deadline: number; label: string }) {
  const now = useNow();
  return (
    <Body muted testID="countdown">
      {label} {formatRemaining(deadline - now)}
    </Body>
  );
}

function SafetyBar({ match, light }: { match: MatchView; light?: boolean }) {
  const deviceId = useDeviceId();
  const cancel = useMutation(api.tango.cancel);
  const block = useMutation(api.tango.block);
  const report = useMutation(api.tango.report);
  const [reporting, setReporting] = useState(false);
  const { busy, run } = useAction();
  const args = { deviceId, matchId: match.id };
  const canCancel = match.status !== 'completed' && !(match.status === 'revealed' && match.done);

  if (reporting) {
    return (
      <Card>
        <Body style={{ fontWeight: '700' }}>What happened?</Body>
        <Body muted>Your report is private. The other person is blocked and never told who reported.</Body>
        {REPORT_REASONS.map((reason) => (
          <Button
            key={reason.id}
            testID={`report-${reason.id}`}
            label={reason.label}
            variant="danger"
            busy={busy === reason.id}
            onPress={() => run(reason.id, () => report({ ...args, reason: reason.id as ReportReason }))}
          />
        ))}
        <Button label="Back" variant="ghost" onPress={() => setReporting(false)} />
      </Card>
    );
  }

  const tint = light ? '#FFFFFF' : colors.muted;
  return (
    <View style={styles.safetyBar}>
      {canCancel && (
        <SafetyButton
          testID="button-cancel"
          icon={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }}
          label="Cancel"
          tint={tint}
          onPress={() => run('cancel', () => cancel(args))}
        />
      )}
      <SafetyButton
        testID="button-block"
        icon={{ ios: 'hand.raised', android: 'block', web: 'block' }}
        label="Block"
        tint={tint}
        onPress={() => run('block', () => block(args))}
      />
      <SafetyButton
        testID="button-report"
        icon={{ ios: 'exclamationmark.shield', android: 'report', web: 'report' }}
        label="Report"
        tint={tint}
        onPress={() => setReporting(true)}
      />
    </View>
  );
}

function SafetyButton({
  icon,
  label,
  tint,
  onPress,
  testID,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  tint: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.safetyButton}>
      <SymbolView name={icon} size={22} tintColor={tint} />
      <Text style={[styles.safetyLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

function Invite({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const respond = useMutation(api.tango.respondInvite);
  const { busy, run } = useAction();
  const args = { deviceId, matchId: match.id };

  return (
    <Screen>
      <View style={styles.hero}>
        <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={64} tintColor={colors.accent} />
        <Title style={styles.centerText} testID="invite-title">
          Someone nearby might be your kind of person.
        </Title>
        <Title style={[styles.centerText, { color: colors.accent }]}>Want to Tango?</Title>
        {match.strengths.length > 0 && (
          <Body testID="invite-strengths" style={styles.centerText}>
            You line up on: {match.strengths.join(', ')}
          </Body>
        )}
        <Countdown deadline={match.deadline} label="Invitation expires in" />
      </View>
      {match.accepted ? (
        <Card>
          <Body testID="invite-waiting" style={styles.centerText}>
            You&apos;re in. If they say yes too, we&apos;ll show you where to meet.
          </Body>
        </Card>
      ) : (
        <>
          <Button
            testID="button-accept"
            label="Accept"
            busy={busy === 'accept'}
            onPress={() => run('accept', () => respond({ ...args, accept: true }))}
          />
          <Button
            testID="button-decline"
            label="Not now"
            variant="secondary"
            busy={busy === 'decline'}
            onPress={() => run('decline', () => respond({ ...args, accept: false }))}
          />
        </>
      )}
      <Body muted style={styles.centerText}>
        Neither of you sees the other&apos;s name, photo, or location.
      </Body>
      {match.accepted && <SafetyBar match={match} />}
    </Screen>
  );
}

function Plan({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const confirmPlan = useMutation(api.tango.confirmPlan);
  const { busy, run } = useAction();
  if (!match.place) return null;
  return (
    <Screen>
      <Title testID="plan-title">It&apos;s a Tango!</Title>
      <Body muted>
        You both said yes. Meet here within {RENDEZVOUS_MINUTES} minutes of you both confirming.
      </Body>
      <PlaceCard place={match.place} />
      <Countdown deadline={match.deadline} label="Confirm within" />
      {match.confirmed ? (
        <Card>
          <Body testID="plan-waiting">Confirmed. Waiting for your Tango to confirm too.</Body>
        </Card>
      ) : (
        <Button
          testID="button-confirm-plan"
          label="I'm on my way"
          busy={busy === 'confirm'}
          onPress={() => run('confirm', () => confirmPlan({ deviceId, matchId: match.id }))}
        />
      )}
      <SafetyBar match={match} />
    </Screen>
  );
}

function Rendezvous({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const arrive = useMutation(api.tango.arrive);
  const { busy, run } = useAction();
  if (!match.place) return null;
  return (
    <Screen>
      <Title testID="rendezvous-title">Head to {match.place.name}</Title>
      <Countdown deadline={match.deadline} label="Meeting window closes in" />
      <PlaceCard place={match.place} compact />
      {match.arrived ? (
        <Card>
          <Body testID="arrival-waiting">
            You&apos;re here. Keep this screen open — it lights up when your Tango arrives.
          </Body>
        </Card>
      ) : (
        <Button
          testID="button-arrived"
          label="I'm here"
          busy={busy === 'arrive'}
          onPress={() => run('arrive', () => arrive({ deviceId, matchId: match.id }))}
        />
      )}
      <SafetyBar match={match} />
    </Screen>
  );
}

function Reveal({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const finish = useMutation(api.tango.finish);
  const { busy, run } = useAction();
  if (!match.reveal) return null;
  const { color, symbol } = match.reveal;
  return (
    <View testID="reveal-screen" style={[styles.reveal, { backgroundColor: color.hex }]}>
      <SafeAreaView style={styles.revealInner}>
        <Text style={styles.revealHint}>Look for this screen</Text>
        <View style={styles.revealCenter}>
          <SymbolView
            name={{
              ios: symbol.sfSymbol as SFSymbol,
              android: symbol.materialSymbol as AndroidSymbol,
              web: symbol.materialSymbol as AndroidSymbol,
            }}
            size={220} tintColor="#FFFFFF" />
          <Text testID="reveal-label" style={styles.revealLabel}>
            {color.name} {symbol.name}
          </Text>
        </View>
        <Button
          testID="button-found"
          label="We found each other"
          variant="secondary"
          busy={busy === 'finish'}
          onPress={() => run('finish', () => finish({ deviceId, matchId: match.id }))}
        />
        <SafetyBar match={match} light />
      </SafeAreaView>
    </View>
  );
}

function CheckIn({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const submit = useMutation(api.tango.submitFeedback);
  const dismiss = useMutation(api.tango.dismiss);
  const { busy, run } = useAction();
  const [met, setMet] = useState<boolean | null>(null);
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [connectAgain, setConnectAgain] = useState<boolean | null>(null);
  const [contact, setContact] = useState('');
  const [safetyNote, setSafetyNote] = useState('');
  const args = { deviceId, matchId: match.id };

  if (match.feedback?.submitted) {
    return (
      <Screen>
        <Title>Thanks for checking in</Title>
        {match.feedback.mutual ? (
          <Card>
            <Body testID="mutual-interest" style={{ fontWeight: '700' }}>
              It&apos;s mutual — you both want to connect again.
            </Body>
            {match.feedback.theirContact ? (
              <Body testID="their-contact">They shared: {match.feedback.theirContact}</Body>
            ) : (
              <Body muted>They didn&apos;t leave contact details, or you didn&apos;t share yours.</Body>
            )}
          </Card>
        ) : (
          <Body muted>
            If you both want to connect again, it will show up on your home screen. Nobody is told if
            the other person didn&apos;t.
          </Body>
        )}
        <Button testID="button-done" label="Done" onPress={() => run('dismiss', () => dismiss(args))} />
        <SafetyBar match={match} />
      </Screen>
    );
  }

  const ready = met !== null && feeling !== null && connectAgain !== null;
  return (
    <Screen>
      <Title testID="checkin-title">How was your Tango?</Title>
      <Body muted>Private and optional. Your answers are never shown to the other person.</Body>
      <Heading>Did you meet?</Heading>
      <ChipRow>
        <Chip testID="met-yes" label="Yes" selected={met === true} onPress={() => setMet(true)} />
        <Chip testID="met-no" label="No" selected={met === false} onPress={() => setMet(false)} />
      </ChipRow>
      <Heading>How did it feel?</Heading>
      <ChipRow>
        {FEELINGS.map((f) => (
          <Chip key={f.id} testID={`feeling-${f.id}`} label={f.label} selected={feeling === f.id} onPress={() => setFeeling(f.id)} />
        ))}
      </ChipRow>
      <Heading>Would you like to connect again?</Heading>
      <ChipRow>
        <Chip testID="again-yes" label="Yes" selected={connectAgain === true} onPress={() => setConnectAgain(true)} />
        <Chip testID="again-no" label="No" selected={connectAgain === false} onPress={() => setConnectAgain(false)} />
      </ChipRow>
      {connectAgain && (
        <TextInput
          testID="input-contact"
          style={styles.input}
          value={contact}
          onChangeText={setContact}
          placeholder="Contact to share if it's mutual (optional)"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          maxLength={120}
        />
      )}
      <Heading>Anything we should know? (private)</Heading>
      <TextInput
        testID="input-safety-note"
        style={[styles.input, { minHeight: 70 }]}
        value={safetyNote}
        onChangeText={setSafetyNote}
        placeholder="Safety feedback goes only to the Tango team"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
      />
      <Button
        testID="button-submit-checkin"
        label="Send"
        disabled={!ready}
        busy={busy === 'submit'}
        onPress={() =>
          run('submit', () =>
            submit({
              ...args,
              met: met!,
              feeling: feeling!,
              connectAgain: connectAgain!,
              contact: contact.trim() || undefined,
              safetyNote: safetyNote.trim() || undefined,
            }),
          )
        }
      />
      <Button testID="button-skip" label="Skip" variant="ghost" onPress={() => run('dismiss', () => dismiss(args))} />
      <SafetyBar match={match} />
    </Screen>
  );
}

function Closed({ match }: { match: MatchView }) {
  const deviceId = useDeviceId();
  const dismiss = useMutation(api.tango.dismiss);
  const { busy, run } = useAction();
  return (
    <Screen>
      <View style={styles.hero}>
        <SymbolView name={{ ios: 'moon.stars', android: 'bedtime', web: 'bedtime' }} size={64} tintColor={colors.muted} />
        <Title testID="closed-title" style={styles.centerText}>
          This Tango isn&apos;t happening
        </Title>
        <Body muted style={styles.centerText}>
          That&apos;s okay. Plans change, and nobody is told who stepped away or why. You won&apos;t be
          matched with this person again.
        </Body>
      </View>
      <Button
        testID="button-closed-done"
        label="Back to Tango"
        busy={busy === 'dismiss'}
        onPress={() => run('dismiss', () => dismiss({ deviceId, matchId: match.id }))}
      />
    </Screen>
  );
}

export function MatchFlow({ match }: { match: MatchView }) {
  switch (match.status) {
    case 'invited':
      return <Invite match={match} />;
    case 'planning':
      return <Plan match={match} />;
    case 'rendezvous':
      return <Rendezvous match={match} />;
    case 'revealed':
      return match.done ? <CheckIn match={match} /> : <Reveal match={match} />;
    case 'completed':
      return <CheckIn match={match} />;
    case 'closed':
      return <Closed match={match} />;
  }
}


const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.xl },
  centerText: { textAlign: 'center' },
  safetyBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: space.sm },
  safetyButton: { alignItems: 'center', gap: 4, padding: space.sm, minWidth: 72 },
  safetyLabel: { fontSize: 13, fontWeight: '600' },
  reveal: { flex: 1 },
  revealInner: { flex: 1, padding: space.lg, gap: space.md },
  revealHint: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: space.lg },
  revealCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  revealLabel: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
});
