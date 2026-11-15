# Tango

Project repository for Tango: an [Expo](https://expo.dev) app (Expo Router, TypeScript) backed by [Convex](https://convex.dev).

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

3. In another terminal, start the app

   ```bash
   npx expo start
   ```

   From there you can open it in a [development build](https://docs.expo.dev/develop/development-builds/introduction/), an [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/), an [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), [Expo Go](https://expo.dev/go), or the web.

## Layout

- `src/app/`: screens, using [file-based routing](https://docs.expo.dev/router/introduction). `src/app/_layout.tsx` wraps the app in `ConvexProvider`.
- `convex/`: Convex schema and functions. Read `convex/_generated/ai/guidelines.md` before writing Convex code.
- `AGENTS.md` / `CLAUDE.md`: guidance for coding agents.

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```
