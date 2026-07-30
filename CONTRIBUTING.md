# Contributing to Streaker 🔥

First off, thank you for considering contributing to Streaker! It's people like you that make open-source such a great community to learn, inspire, and create.

## 🤝 How Can I Contribute?

### Reporting Bugs
If you find a bug, please create an issue providing as much detail as possible:
- A clear and descriptive title
- Steps to reproduce the bug
- Expected vs. actual behavior
- Device / OS versions you tested on

### Suggesting Enhancements
Have an idea for a new feature or improvement? We’d love to hear it! Open an issue and describe your idea. If you’re willing to implement it yourself, mention that!

### Code Contributions
1. **Fork the repo** and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes (if applicable).
5. Make sure your code lints properly.

## 💻 Development Setup

### 1. Project Structure
The app uses **Expo Router** for file-based routing.
- `src/app/`: Contains all screens and routing logic.
- `components/`: Reusable React components (UI components, modals, etc).
- `store/`: Zustand state management stores (`useAuthStore`, `useStreakStore`, etc).
- `utils/`: Helper functions and constants.
- `supabase/`: Database schema, migrations, and Edge Functions.

### 2. Style Guide
- We use **NativeWind** (Tailwind CSS) for styling. Please use Tailwind utility classes in `className` props rather than inline `StyleSheet` objects whenever possible.
- Use **TypeScript** strictly. Avoid using `any` unless absolutely necessary.
- Components should be functional components using React Hooks.

## 📥 Pull Request Process
1. Update the `README.md` with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations, and container parameters.
2. Ensure your commits are descriptive and follow standard conventional commit formats (e.g., `feat: added dark mode`, `fix: leaderboard rendering bug`).
3. Submit the Pull Request for review! The maintainers will review and potentially suggest some changes.

Thank you for contributing to Streaker! Let's build better habits together! 🚀
