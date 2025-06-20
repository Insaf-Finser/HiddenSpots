/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#6E45E2';
const tintColorDark = '#88D3CE';
const accentColor = '#FFB86C'; // Peach
const accentColor2 = '#FF6B6B'; // Coral
const gold = '#FFD700';
const cardGradient = ['#f8fafc', '#e0e7ff'];
const backgroundGradient = ['#f8fafc', '#e0e7ff'];

export const Colors = {
  light: {
    text: '#22223B',
    background: '#f8fafc',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    accent: accentColor,
    accent2: accentColor2,
    gold,
    cardGradient,
    backgroundGradient,
    card: '#fff',
    border: '#e0e7ff',
    shadow: 'rgba(110,69,226,0.08)',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accent: accentColor,
    accent2: accentColor2,
    gold,
    cardGradient: ['#232946', '#121629'],
    backgroundGradient: ['#232946', '#121629'],
    card: '#232946',
    border: '#232946',
    shadow: 'rgba(136,211,206,0.08)',
  },
};
