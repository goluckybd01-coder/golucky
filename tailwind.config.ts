import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ['"DM Sans"', 'Inter', 'Noto Sans Bengali', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['"Space Grotesk"', '"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      bengali: ['Noto Sans Bengali', '"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow-pulse": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 165, 0, 0.4))",
          },
          "50%": {
            filter: "drop-shadow(0 0 15px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 35px rgba(255, 165, 0, 0.6))",
          },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(200%) skewX(-15deg)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0) rotateX(0deg) rotateY(0deg)" },
          "25%": { transform: "translateY(-8px) rotateX(2deg) rotateY(-3deg)" },
          "50%": { transform: "translateY(-16px) rotateX(0deg) rotateY(0deg)" },
          "75%": { transform: "translateY(-8px) rotateX(-2deg) rotateY(3deg)" },
        },
        "crown-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))" },
          "50%": { filter: "drop-shadow(0 0 12px rgba(255, 215, 0, 0.9))" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "grow-up": {
          "0%": { height: "0%", opacity: "0" },
          "100%": { height: "var(--target-height)", opacity: "1" },
        },
        "timer-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.3)" },
        },
        "timer-urgent": {
          "0%, 100%": { transform: "scale(1)", backgroundColor: "rgb(254, 243, 199)" },
          "50%": { transform: "scale(1.08)", backgroundColor: "rgb(254, 202, 202)" },
        },
        "timer-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "colon-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "cashout-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(249, 115, 22, 0.7)" },
          "50%": { transform: "scale(1.03)", boxShadow: "0 0 20px 4px rgba(249, 115, 22, 0.5)" },
        },
        "card-bounce": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.95)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(0.98)" },
        },
        "attention-shake": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "10%": { transform: "translateX(-3px) rotate(-1deg)" },
          "20%": { transform: "translateX(3px) rotate(1deg)" },
          "30%": { transform: "translateX(-3px) rotate(-1deg)" },
          "40%": { transform: "translateX(3px) rotate(1deg)" },
          "50%": { transform: "translateX(-2px) rotate(-0.5deg)" },
          "60%": { transform: "translateX(2px) rotate(0.5deg)" },
          "70%": { transform: "translateX(-1px) rotate(0deg)" },
          "80%": { transform: "translateX(1px) rotate(0deg)" },
          "90%": { transform: "translateX(0) rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shimmer": "shimmer 0.8s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "crown-glow": "crown-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "marquee": "marquee 15s linear infinite",
        "grow-up": "grow-up 1s ease-out forwards",
        "timer-pulse": "timer-pulse 0.6s ease-in-out infinite",
        "timer-urgent": "timer-urgent 0.4s ease-in-out infinite",
        "timer-shake": "timer-shake 0.3s ease-in-out infinite",
        "colon-blink": "colon-blink 0.5s ease-in-out infinite",
        "card-bounce": "card-bounce 0.2s ease-out forwards",
        "cashout-pulse": "cashout-pulse 0.8s ease-in-out infinite",
        "attention-shake": "attention-shake 0.6s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
