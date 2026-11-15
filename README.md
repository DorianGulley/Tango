# Tango

Tango helps you meet the people you already pass on campus and might never realize you're compatible with. It's limited to Stanford for now: accounts need a @stanford.edu email, and introductions happen at curated public spots on campus: turn on Tango Mode, accept an anonymous invitation, meet at a public spot, and find each other by a matching color and symbol on both phones. It's an [Expo](https://expo.dev) app (Expo Router, TypeScript) backed by [Convex](https://convex.dev).

Every product decision the concept doc left open (timings, distances, questions, environments, reveal palette) lives in `convex/tangoConfig.ts`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Convex backend. The first run logs you in, links a dev deployment, pushes `convex/`, regenerates `convex/_generated`, and writes `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL`, and `EXPO_PUBLIC_CONVEX_SITE_URL` to `.env.local` (gitignored). See `.env.example` for the variables.

   ```bash
   npm run convex
   ```

   In CI or a headless machine, set `CONVEX_DEPLOY_KEY` in the environment instead of logging in, and run `npx convex dev --once`.

3. Seed the curated Stanford campus rendezvous points (idempotent; it also removes any spot no longer in the list):

   ```bash
   npx convex run seed:seedLocations
   ```

4. In another terminal, start the app

   ```bash
   npx expo start
   ```

   From there you can open it in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), [Expo Go](https://expo.dev/go), or the web.

## Layout

- `src/app/`: screens, using [file-based routing](https://docs.expo.dev/router/introduction). `src/app/_layout.tsx` wraps the app in `ConvexProvider`.
- `convex/`: Convex schema and functions. `tango.ts` holds the client API, `matching.ts` the matching engine and expiry jobs, `seed.ts` the curated locations. Read `convex/_generated/ai/guidelines.md` before writing Convex code.
- Identity is an anonymous random id per device, kept in `expo-secure-store`; there is no auth provider yet.
- `AGENTS.md` / `CLAUDE.md`: guidance for coding agents.

## Checks

The typecheck needs `expo-env.d.ts` and `.expo/types`, which Expo generates (gitignored) the first time `npx expo start` runs.

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```
