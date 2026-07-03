/* ============================================================
   Firebase config — fill this in to enable cross-device sync.
   Without it, the site still works fully offline via localStorage
   (single device/browser only).

   SETUP (5 min, free):
   1. Go to https://console.firebase.google.com → "Add project"
      (name it anything, e.g. "japan-trip-2026"). Skip Analytics.
   2. In the project: Build → Firestore Database → "Create database"
      → start in "Production mode" → pick any region → Enable.
   3. In Firestore → Rules tab, paste this and Publish:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /trips/{tripId} {
              allow read, write: if request.auth != null;
            }
          }
        }

   4. Build → Authentication → Get started → Sign-in method →
      enable "Anonymous".
   5. Project settings (gear icon) → General → "Your apps" →
      add a Web app (</>) → copy the firebaseConfig object shown
      → paste the values below, replacing the placeholders.
   6. Commit + push this file. Reload the site — the sync badge
      in the top nav should turn to "✓ ซิงค์แล้ว".
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  // shared document all devices read/write — leave as-is unless
  // you want a different trip to use its own doc.
  tripId: 'japan-oct-2026',
};
