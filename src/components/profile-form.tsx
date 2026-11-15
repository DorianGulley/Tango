import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { api } from '@/../convex/_generated/api';
import { ITEMS, type Answers } from '@/../convex/compatibility';
import {
  ALLOWED_EMAIL_DOMAIN,
  CAMPUS_NAME,
  ENVIRONMENT_IDS,
  isAllowedEmail,
  GENDERS,
  MAX_AGE,
  MIN_AGE,
  OPTIONAL_ITEMS,
  type Environment,
  type Gender,
} from '@/../convex/tangoConfig';
import { Body, Button, Card, Chip, ChipRow, Heading, Screen, Title } from '@/components/ui';
import { useDeviceId } from '@/lib/device';
import { showError } from '@/lib/errors';
import { colors, radius, space } from '@/theme';

export type Profile = {
  email: string | null;
  name: string;
  age: number;
  gender: Gender;
  interestedIn: Gender[];
  ageMin: number;
  ageMax: number;
  bio: string | null;
  quiz: Answers | null;
  environments: Environment[];
};

const QUIZ_SECTIONS = [
  { title: 'What you want', items: ITEMS.slice(0, 3) },
  { title: 'Values and life', items: ITEMS.slice(3, 10) },
  { title: 'Your personality', items: ITEMS.slice(10, 15) },
  { title: 'Getting close', items: ITEMS.slice(15, 19) },
  { title: 'How you do relationships', items: ITEMS.slice(19, 24) },
  { title: 'Lifestyle', items: ITEMS.slice(24) },
];
const STEPS = ['About you', 'Who you want to meet', ...QUIZ_SECTIONS.map((s) => s.title)];
const QUIZ_START = 2;

type Item = (typeof ITEMS)[number];

function isAnswered(item: Item, quiz: Answers) {
  return quiz[item.id] !== undefined || OPTIONAL_ITEMS.includes(item.id);
}

function QuizItem({ item, value, onChange }: { item: Item; value: string | number | undefined; onChange: (v: string | number | undefined) => void }) {
  const optional = OPTIONAL_ITEMS.includes(item.id);
  return (
    <Card>
      <Body style={{ fontWeight: '700' }}>{item.text}</Body>
      {item.kind === 'choice' ? (
        <ChipRow>
          {item.options.map((option) => (
            <Chip
              key={option.value}
              testID={`${item.id}-${option.value}`}
              label={option.label}
              selected={value === option.value}
              onPress={() => onChange(option.value)}
            />
          ))}
        </ChipRow>
      ) : (
        <View style={{ gap: 6 }}>
          <View style={styles.scaleRow}>
            {Array.from({ length: item.max - item.min + 1 }, (_, i) => item.min + i).map((n) => (
              <Pressable
                key={n}
                testID={`${item.id}-${n}`}
                accessibilityRole="radio"
                accessibilityLabel={`${item.id} ${n}`}
                accessibilityState={{ selected: value === n }}
                onPress={() => onChange(n)}
                style={[styles.scaleDot, value === n && styles.scaleDotSelected]}>
                <Text style={[styles.scaleLabel, value === n && { color: '#FFFFFF' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.scaleEnds}>
            <Text style={styles.scaleEnd}>{item.lo}</Text>
            <Text style={[styles.scaleEnd, { textAlign: 'right' }]}>{item.hi}</Text>
          </View>
        </View>
      )}
      {optional && (
        <Chip
          testID={`${item.id}-skip`}
          label="Prefer not to say"
          selected={value === undefined}
          onPress={() => onChange(undefined)}
        />
      )}
    </Card>
  );
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function toAge(text: string) {
  const n = parseInt(text, 10);
  return Number.isFinite(n) ? n : 0;
}

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const deviceId = useDeviceId();
  const saveProfile = useMutation(api.users.saveProfile);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState(initial?.email ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [gender, setGender] = useState<Gender | null>(initial?.gender ?? null);
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [interestedIn, setInterestedIn] = useState<Gender[]>(initial?.interestedIn ?? []);
  const [ageMin, setAgeMin] = useState(String(initial?.ageMin ?? 21));
  const [ageMax, setAgeMax] = useState(String(initial?.ageMax ?? 40));
  const [quiz, setQuiz] = useState<Answers>(initial?.quiz ?? {});

  const ageNumber = toAge(age);
  const emailValid = isAllowedEmail(email);
  const quizSection = QUIZ_SECTIONS[step - QUIZ_START];
  const stepValid = quizSection
    ? quizSection.items.every((item) => isAnswered(item, quiz))
    : [
    emailValid && name.trim().length > 0 && ageNumber >= MIN_AGE && ageNumber <= MAX_AGE && gender !== null,
    interestedIn.length > 0 &&
      toAge(ageMin) >= MIN_AGE &&
      toAge(ageMax) <= MAX_AGE &&
      toAge(ageMin) <= toAge(ageMax),
  ][step];
  const isLast = step === STEPS.length - 1;

  async function submit() {
    if (!gender) return;
    setSaving(true);
    try {
      await saveProfile({
        deviceId,
        email,
        name,
        age: ageNumber,
        gender,
        interestedIn,
        ageMin: toAge(ageMin),
        ageMax: toAge(ageMax),
        bio: bio.trim() || undefined,
        quiz,
        environments: initial?.environments ?? ENVIRONMENT_IDS,
      });
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Body muted>
        Step {step + 1} of {STEPS.length}
      </Body>
      <Title>{STEPS[step]}</Title>

      {step === 0 && (
        <>
          {!initial?.email && (
            <Body muted>
              Meet the people you already pass on campus. Tango is open to {CAMPUS_NAME} students and staff for now.
            </Body>
          )}
          <Heading>{CAMPUS_NAME} email</Heading>
          <TextInput
            testID="input-email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            maxLength={120}
          />
          {email.includes('@') && !emailValid && (
            <Body style={{ color: colors.danger }}>Use your @{ALLOWED_EMAIL_DOMAIN} address.</Body>
          )}
          <Heading>First name</Heading>
          <TextInput
            testID="input-name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            maxLength={40}
          />
          <Heading>Age</Heading>
          <TextInput
            testID="input-age"
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder={`${MIN_AGE}+`}
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={2}
          />
          {age.length === 2 && ageNumber < MIN_AGE && (
            <Body style={{ color: colors.danger }}>Tango is for people {MIN_AGE} and over.</Body>
          )}
          <Heading>I am a</Heading>
          <ChipRow>
            {GENDERS.map((g) => (
              <Chip
                key={g.id}
                testID={`gender-${g.id}`}
                label={g.label}
                selected={gender === g.id}
                onPress={() => setGender(g.id)}
              />
            ))}
          </ChipRow>
          <Heading>About me (optional)</Heading>
          <TextInput
            testID="input-bio"
            style={[styles.input, { minHeight: 80 }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Only you see this for now"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={280}
          />
        </>
      )}

      {step === 1 && (
        <>
          <Heading>Interested in</Heading>
          <ChipRow>
            {GENDERS.map((g) => (
              <Chip
                key={g.id}
                testID={`interested-${g.id}`}
                label={g.label}
                selected={interestedIn.includes(g.id)}
                onPress={() => setInterestedIn(toggle(interestedIn, g.id))}
              />
            ))}
          </ChipRow>
          <Heading>Age range</Heading>
          <View style={styles.row}>
            <TextInput
              testID="input-age-min"
              style={[styles.input, styles.flex]}
              value={ageMin}
              onChangeText={setAgeMin}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Body muted>to</Body>
            <TextInput
              testID="input-age-max"
              style={[styles.input, styles.flex]}
              value={ageMax}
              onChangeText={setAgeMax}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </>
      )}

      {quizSection && (
        <>
          {step === QUIZ_START && (
            <Body muted>
              {ITEMS.length} quick questions, about five minutes. Only Tango sees your answers; matches never do.
            </Body>
          )}
          {quizSection.items.map((item) => (
            <QuizItem
              key={item.id}
              item={item}
              value={quiz[item.id]}
              onChange={(value) => {
                const next = { ...quiz };
                if (value === undefined) delete next[item.id];
                else next[item.id] = value;
                setQuiz(next);
              }}
            />
          ))}
        </>
      )}

      <View style={styles.footer}>
        <Button
          testID={isLast ? 'button-save-profile' : 'button-next'}
          label={isLast ? (initial?.email ? 'Save' : 'Finish') : 'Next'}
          disabled={!stepValid}
          busy={saving}
          onPress={isLast ? submit : () => setStep(step + 1)}
        />
        {step > 0 && <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} />}
        {step === 0 && initial?.email && <Button label="Cancel" variant="ghost" onPress={() => router.back()} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.text,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  scaleDot: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  scaleLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  scaleEnd: { flex: 1, fontSize: 13, color: colors.muted },
  footer: { marginTop: 'auto', gap: space.sm, paddingTop: space.lg },
});
