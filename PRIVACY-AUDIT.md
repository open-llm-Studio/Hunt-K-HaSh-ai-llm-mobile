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

## Still open — needs a decision

### 1. `android/app/google-services.json` is Mintplex's Firebase project

It still carries their `project_id` (`anythingllm-mobile`), project number and
API key. It was left in place because the Android build fails without it: the
`google-services` Gradle plugin requires the file.

With analytics off nothing is reported, but this should not ship as is. Pick one:

- **Remove Firebase entirely** — drop `@react-native-firebase/*`, the Gradle
  plugin and the App Check pods. Cleanest if you do not need App Check.
- **Use your own Firebase project** — replace `google-services.json` (and add
  `GoogleService-Info.plist` for iOS) with one registered for
  `com.huntkhashai`.

Note the app id changed to `com.huntkhashai`, so their Firebase app no longer
matches this package in any case.

### 2. Firebase App Check is still linked

`Firebase/AppCheck` is in the iOS Podfile and `APPCHECK_DEBUG_TOKEN_*` env keys
exist. App Check attests the app to Google, which is an outbound call to a third
party even with analytics disabled. It goes away with option 1 above.

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
