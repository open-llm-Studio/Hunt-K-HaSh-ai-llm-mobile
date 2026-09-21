# Outbound data audit

What the app sends off the device, what was changed, and what is still open.
Audited against the upstream AnythingLLM mobile app at the point this fork was
taken.

## Found: telemetry to Firebase Analytics — removed

Upstream logged usage events to **Firebase Analytics**, in the Mintplex Labs
Firebase project `anythingllm-mobile`, with **no opt-out**. The events covered:

- every completed, aborted, retried or deleted chat (with metadata)
- documents imported and images attached
- workspaces created, threads exported and forked
- onboarding survey answers
- model provider and model chosen

**Changed.** `src/utils/Telemetry` no longer calls Firebase; it drops every
event. The call sites are left in place so an upstream port does not have to
re-thread them.

Firebase Analytics also collects sessions, screen views and an advertising ID
on its own, without explicit events, so collection is disabled at the SDK level
too:

- `firebase.json` — `analytics_auto_collection_enabled: false`,
  `analytics_collection_deactivated: true`, ad-ID and screen reporting off
- `android/.../AndroidManifest.xml` — the same flags, and the advertising-ID
  permissions (`AD_ID`, `ACCESS_ADSERVICES_AD_ID`,
  `ACCESS_ADSERVICES_ATTRIBUTION`) are removed with `tools:node="remove"`.
  Deleting them from our manifest is not enough: the Firebase library declares
  them itself and Android merges library manifests into the app. Verified
  against the built APK with `aapt2 dump badging` — none are requested.
- `ios/HuntKHashAI/Info.plist` — `FIREBASE_ANALYTICS_COLLECTION_DEACTIVATED`

## Found: web searches sent to a Mintplex server — now opt-in

`src/utils/ToolsManager/tools/webSearch` fell back to a SearXNG instance run by
Mintplex Labs when a You.com search failed, which sent **the user's search
query** there.

**Changed.** The fallback now only runs against a SearXNG instance you host and
name in `SEARXNG_BASE_URL`. With nothing configured there is no fallback.

## Found: IP geolocation through a Mintplex server — now opt-in

The agent "get location" tool called `geojson.anythingllm.com`, which resolves
the caller's approximate location — meaning **the device's IP address** went to
Mintplex Labs whenever an agent asked where the user was.

**Changed.** The lookup only runs against `GEOLOCATION_API_URL`. Unset, the tool
reports that it could not determine a location.

## Found: update check pinging a Mintplex CDN — now opt-in

The settings screen fetched `cdn.anythingllm.com/mobile/latest/version.txt`,
telling that CDN an install existed each time it was opened.

**Changed.** The check uses `UPDATE_CHECK_URL`; empty disables it.

## Found: Firebase SDK tied to Mintplex's project — removed

Even with analytics disabled, the Firebase SDK stayed in the app, configured by
`android/app/google-services.json` for Mintplex Labs' Firebase project
(`anythingllm-mobile`). Firebase Installations can contact
`firebaseinstallations.googleapis.com` on start-up regardless of the analytics
settings, and nothing in the app used Firebase.

**Changed.** Firebase is gone:

- `@react-native-firebase/app` and `@react-native-firebase/analytics` removed
  from `package.json`
- the `com.google.gms.google-services` Gradle plugin removed from both
  `build.gradle` files
- `android/app/google-services.json` and `firebase.json` deleted, and the
  Fastlane step that wrote `google-services.json` from a secret removed
- the Firebase flags removed from `AndroidManifest.xml` and `Info.plist`, and
  the unused `APPCHECK_DEBUG_TOKEN_*` env keys removed

The advertising-ID permissions stay explicitly removed in
`AndroidManifest.xml`, as a guard in case a Google library is added later.

On iOS, run `pod install` once: it removes the React Native Firebase build
phase that CocoaPods added to `project.pbxproj`.

### Adding your own Firebase project later

Only if you need a Firebase feature (crash reports, push notifications). Every
Firebase feature sends data to Google.

1. Create a Firebase project and register the Android app `com.huntkhashai`
   (and the iOS bundle id).
2. `yarn add @react-native-firebase/app` plus the feature package you need.
3. Add `classpath 'com.google.gms:google-services:4.4.3'` to
   `android/build.gradle` and `apply plugin: 'com.google.gms.google-services'`
   to `android/app/build.gradle`.
4. Put your `google-services.json` in `android/app/` and
   `GoogleService-Info.plist` in `ios/HuntKHashAI/`, then `pod install`.
5. Turn off automatic collection you do not want (`firebase.json`) before
   shipping.

## Expected outbound traffic, by design

These are the user's own choices, not background reporting:

- **Model providers** — OpenAI, Anthropic, OpenRouter, Together, xAI and any
  OpenAI-compatible endpoint the user configures. Prompts go where the user
  points them.
- **Hugging Face** — downloading local models the user picks, and their avatars.
- **You.com** — web search, using the user's own key.
- **A Hunt-K-HaSh AI server** — when the user pairs the app with their own
  instance by QR code.
- **Google Play** — only when the user taps through to the store listing.

## How to re-check

```bash
git grep -n "fetch(" -- src | grep -v "localhost"
git grep -rn "anythingllm\.com\|firebase\|analytics" -- src android ios
```
