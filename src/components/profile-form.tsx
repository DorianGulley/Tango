import { useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/../convex/_generated/api';
import {
  ALLOWED_EMAIL_DOMAIN,
  CAMPUS_NAME,
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  GENDERS,
  INTENTIONS,
  MAX_AGE,
  MIN_AGE,
  QUESTIONS,
  type Environment,
  type Gender,
  type Intention,
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
  intention: Intention;
  bio: string | null;
  answers: number[];
  environments: Environment[];
};

const STEPS = ['About you', 'Who you want to meet', 'A few quick questions', 'Where you like to meet'];

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
  const [intention, setIntention] = useState<Intention | null>(initial?.intention ?? null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    initial?.answers ?? QUESTIONS.map(() => null),
  );
  const [environments, setEnvironments] = useState<Environment[]>(
    initial?.environments ?? ENVIRONMENT_IDS,
  );

  const ageNumber = toAge(age);
  const emailValid = email.trim().toLowerCase().endsWith(`.${ALLOWED_EMAIL_DOMAIN}`) || email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
  const stepValid = [
    emailValid && name.trim().length > 0 && ageNumber >= MIN_AGE && ageNumber <= MAX_AGE && gender !== null,
    interestedIn.length > 0 &&
      intention !== null &&
      toAge(ageMin) >= MIN_AGE &&
      toAge(ageMax) <= MAX_AGE &&
      toAge(ageMin) <= toAge(ageMax),
    answers.every((a) => a !== null),
    environments.length > 0,
  ][step];
  const isLast = step === STEPS.length - 1;

  async function submit() {
    if (!gender || !intention) return;
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
        intention,
        bio: bio.trim() || undefined,
        answers: answers.map((a) => a ?? 0),
        environments,
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
          <Heading>Looking for</Heading>
          <ChipRow>
            {INTENTIONS.map((i) => (
              <Chip
                key={i.id}
                testID={`intention-${i.id}`}
                label={i.label}
                selected={intention === i.id}
                onPress={() => setIntention(i.id)}
              />
            ))}
          </ChipRow>
        </>
      )}

      {step === 2 &&
        QUESTIONS.map((question, qi) => (
          <Card key={question.prompt}>
            <Body style={{ fontWeight: '700' }}>{question.prompt}</Body>
            <ChipRow>
              {question.options.map((option, oi) => (
                <Chip
                  key={option}
                  testID={`q${qi}-o${oi}`}
                  label={option}
                  selected={answers[qi] === oi}
                  onPress={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))}
                />
              ))}
            </ChipRow>
          </Card>
        ))}

      {step === 3 && (
        <>
          <Body muted>
            Tango only meets at curated public spots on the {CAMPUS_NAME} campus. Turn off any kind of place
            you would rather skip.
          </Body>
          <ChipRow>
            {ENVIRONMENTS.map((e) => (
              <Chip
                key={e.id}
                testID={`env-${e.id}`}
                label={e.label}
                selected={environments.includes(e.id)}
                onPress={() => setEnvironments(toggle(environments, e.id))}
              />
            ))}
          </ChipRow>
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
  footer: { marginTop: 'auto', gap: space.sm, paddingTop: space.lg },
});
