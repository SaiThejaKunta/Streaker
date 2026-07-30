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
2. Go to the **SQL Editor** in Supabase and run the provided schema scripts to set up the database and permissions.
3. Go to **Project Settings -> API** to get your API URL and `anon` public key.

### 4. Configure Environment Variables

Create a `.env` file in the root of the project and add your Supabase credentials:

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
