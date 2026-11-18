/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Dark (mevcut tasarım) ─────────────────────────────
        // Hiçbir `dark:` prefix'i olmayan eski class'lar bu değerleri kullanır.
        // NativeWind v4'te setColorScheme('dark') aktifken `dark:` variant'lar
        // bu değerlere erişebilmek için aynı isimle override edilebilir.
        background: "#0f0f0f",
        surface: "#1a1a1a",
        "surface-1": "#1a1a1a",
        "surface-2": "#242424",
        "surface-3": "#2e2e2e",
        primary: "#6C63FF",
        "primary-dark": "#5A52E0",
        "primary-light": "#8B84FF",
        secondary: "#FF6584",
        accent: "#43E97B",
        "text-primary": "#F5F5F5",
        "text-secondary": "#A0A0A0",
        "text-muted": "#606060",
        border: "#2e2e2e",
        "border-light": "#3e3e3e",
        error: "#FF4D4D",
        warning: "#FFB347",
        success: "#43E97B",
        info: "#4FC3F7",

        // ─── Light tokens (tema toggle için) ─────────────────────
        // Kullanım: <View className="bg-light-background dark:bg-background">
        // `dark:` variant aktifken (setColorScheme('dark')) dark token kullanılır,
        // aksi halde light token. Bu sayede mevcut `bg-background` class'ları
        // değiştirmeden incremental refactor yapılabilir.
        "light-background": "#FAFAFA",
        "light-surface": "#FFFFFF",
        "light-surface-1": "#FFFFFF",
        "light-surface-2": "#F5F5F5",
        "light-surface-3": "#EBEBEB",
        "light-text-primary": "#0F0F0F",
        "light-text-secondary": "#5A5A5A",
        "light-text-muted": "#9E9E9E",
        "light-border": "#E5E5E5",
        "light-border-light": "#D4D4D4",
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        mono: ["JetBrainsMono", "monospace"],
      },
    },
  },
  plugins: [],
};
