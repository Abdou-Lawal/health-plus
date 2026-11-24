# Health+

An offline-first web app that helps someone **prepare for a visit to a health professional**. It does not diagnose, name diseases, or suggest treatments.

Built for the #BuildHybridAI 2026 hackathon with **Firebase AI Logic hybrid inference** (Web / Chrome).

## How the hybrid AI works

| Step | Where it runs | What happens |
|---|---|---|
| Red-flag check | Fixed rules in code | Chest pain, breathing trouble, unconsciousness, severe bleeding, seizure, stroke signs, self-harm, fever in a baby under 3 months trigger a full-screen emergency alert. The AI never decides this. |
| Structuring | **On-device** (Gemini Nano, `InferenceMode.ONLY_ON_DEVICE`) | The description is turned into symptoms, warning signs, follow-up questions and an orientation level. Nothing leaves the device. |
| Fallback | **Cloud** (Gemini, `InferenceMode.ONLY_IN_CLOUD`) | Only if the on-device model is unavailable, and only after the user sees exactly what would be sent and accepts. |
| Summary | Code | A plain-text summary to show at the clinic, saved in `localStorage` on the device. |

A badge at the top always shows which path answered, read from `response.inferenceSource` (`ON_DEVICE` or `IN_CLOUD`).

## Setup

1. Create a Firebase project and enable **AI Logic** (Gemini Developer API) in the console.
2. Register a **Web app** and copy its config into `firebaseConfig` in `public/index.html`.
3. Enable **App Check** with reCAPTCHA Enterprise, put the site key in `RECAPTCHA_SITE_KEY`.
4. For local testing, open the page on `http://localhost` (or add `?debug`). A debug token is printed in the browser console: register it under App Check > Apps > Manage debug tokens.
5. Set `EMERGENCY_NUMBER` after checking an official source for your country.

Run locally (any static server, Chrome on desktop):

```bash
npx serve public     # or: python3 -m http.server -d public 8000
```

Deploy: `firebase deploy --only hosting` (uses `firebase.json`).

## Using the on-device model

- Chrome on desktop, version 139 or newer, with the Prompt API / on-device model enabled (see the Firebase AI Logic hybrid docs).
- Enough hardware for Gemini Nano (see the Chrome built-in AI requirements). The first request downloads the model.
- The app pins the Firebase JS SDK to 12.8.0 through the gstatic CDN. Change the version in the three `import` lines if needed.

## Safety design

- Not a diagnosis tool: the model prompt forbids diagnoses, disease names, treatments and reassurance, and every result says so.
- Emergency screen is rule-based and over-triggers on purpose (for example, "no chest pain" still triggers it).
- Cloud use needs explicit consent each time, after showing the exact text sent. No name is requested.
- The model output is parsed defensively; if it cannot be read, the app falls back to "see a health professional soon".
- Low temperature (0.2) for both paths.
- A closed panel "For the health professional" ends each symptom result: reported facts, alert-rule status and questions to complete the history. It contains no diagnosis and no treatment proposal, and says so.

## Known limits (current version)

- Single-turn generation only (the on-device model does not support chat).
- Offline use after the first load needs a service worker (planned).
- A queue to send photos when the connection returns is planned.

## Offline use

`public/sw.js` caches the app, its images and the Firebase SDK modules. Open the app once while online (and let the on-device model finish downloading); after that the app opens and runs without a connection. App code is fetched network-first (4 s timeout), so changes show up as soon as you are online.

## Photo scan

The Scan tab accepts a JPEG or PNG of a prescription, a medicine box, or a skin area.

- The image is re-encoded in the browser (resized, JPEG), which removes EXIF data such as location.
- Photos go to the cloud model only, after a consent dialog that shows the photo and the exact text sent.
- **Skin photos are blocked until the user gives the body area and a detailed description** (at least 40 characters). Fixed rules can trigger the emergency screen from that description.
- The model only describes visible features. It never names a disease, never says whether something is harmless, and never reassures: a skin result is never lower than "See a health professional soon".
- Prescriptions: the model copies what is written. The app reminds the user to confirm with a pharmacist.

## History

Each result is saved in `localStorage` on the device. The History tab lists and deletes them.

## License

MIT, see `LICENSE`.
