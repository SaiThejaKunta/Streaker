<div align="center">
  <img src="assets/images/icon.png" width="120" height="120" alt="Streaker Logo" />
  <h1>Streaker 🔥</h1>
  <p><strong>A Social Habit Tracking & Accountability App</strong></p>
</div>

Streaker is a modern, gamified habit-tracking application built with React Native and Supabase. It allows users to create solo or group streaks, invest virtual coins as buy-ins, and verify each other's check-ins to build consistency and accountability.

---

## ✨ Features

- **Solo & Group Streaks**: Track habits individually or invite friends to build habits together.
- **Coin Buy-Ins**: Gamify your habits! Stake virtual coins when joining a streak. Miss a day, and you lose them to the rest of the group.
- **Social Accountability**: Group check-ins go into a "Pending Verification" state. A group member must approve your check-in for it to count.
- **Global Leaderboard**: Compete with friends and the global community to earn the most coins and maintain the highest completion rates.
- **Live Activity Feed**: See when your friends join streaks, check in, hit milestones, or miss a day in real-time.

---

## 🛠 Tech Stack

- **Frontend**: [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) (File-based routing with Expo Router)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Row Level Security, Realtime Subscriptions)

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Expo Go app on your iOS/Android device, or a configured iOS Simulator / Android Emulator.
- A free [Supabase](https://supabase.com/) account.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/streaker.git
cd streaker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new project in your Supabase dashboard.
2. Go to the **SQL Editor** in Supabase and run [`supabase/schema.sql`](supabase/schema.sql) to set up the tables, functions, triggers, Row Level Security policies, and the `avatars` storage bucket.
3. Go to **Project Settings -> API** to get your API URL and `anon` public key.

This is enough to run the app and work on most screens/features. If you're working on push notifications or the missed-day coin redistribution, see [Additional Setup](#-additional-setup-notifications--redistribution) below - those need a few things `schema.sql` can't set up on its own.

### 4. Configure Environment Variables

Copy `.env.example` to `.env` in the root of the project and fill in your Supabase credentials from step 3 above:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start the App

```bash
npx expo start
```

Press `a` to open in Android Emulator, `i` to open in iOS Simulator, or scan the QR code with the Expo Go app on your physical device.

---

## 🔔 Additional Setup: Notifications & Redistribution

Only needed if you're working on push notifications (check-in verification requests, streak invitations) or the missed-day coin redistribution feature. Skip this if you're just working on other screens/features.

### Edge Functions

These live in `supabase/functions/` and don't deploy themselves - `schema.sql` only covers plain SQL, not function code:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy redistribute-missed-days
npx supabase functions deploy notify-verification-request
npx supabase functions deploy notify-invitation
```

### Database Webhooks (for push notifications)

In the Supabase Dashboard, go to **Database -> Webhooks** and create two webhooks, both type "Supabase Edge Functions":
- Table `activities`, event **Insert** -> function `notify-verification-request`
- Table `invitations`, event **Insert** -> function `notify-invitation`

### Cron Job (for coin redistribution)

In the Dashboard, go to **Integrations -> Cron** (installs the `pg_net` extension if you haven't already) and create a job:
- Schedule: `0 0 * * *` (daily, UTC midnight)
- Type: **Supabase Edge Functions** -> `redistribute-missed-days`

### Push Notification Credentials (Android)

Push tokens will fail silently without these - the app will still run, but `getExpoPushTokenAsync()` throws:

1. In [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> Service Accounts, generate a private key and upload it under your [Expo project's Android credentials](https://expo.dev/) as the "FCM V1 service account key".
2. Download `google-services.json` from Firebase Console -> Project Settings -> General -> your Android app, place it at the project root, and it'll be picked up via `app.json`'s `android.googleServicesFile`.
3. This step requires a real native build (`eas build`) to take effect - it can't ship via `eas update`/OTA.

---

## 🤝 Contributing

We welcome contributions from the community! Whether you want to fix a bug, add a feature, or improve documentation, your help is appreciated.

Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines on how to submit pull requests, report issues, and follow our coding standards.

### How to Contribute
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
