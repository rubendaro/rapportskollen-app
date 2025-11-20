// theme.ts
import { TextStyle, ViewStyle } from "react-native";

// 🎨 Colors
export const COLORS = {
  primary: "#7EB734", // Brand green
  secondary: "#1E1E1E",
  background: "#F4F4F4",
  white: "#FFFFFF",
  gray: "#9E9E9E",
  error: "#E53935",
  success: "#4CAF50",
};

// 📝 Font style types
interface FontStyles {
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  small: TextStyle;
}

// 🔤 Font presets
export const FONT: FontStyles = {
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.secondary,
  },
  small: {
    fontSize: 14,
    color: COLORS.gray,
  },
};

// 🧿 Button style types
interface ButtonStyles {
  primary: ViewStyle;
  primaryText: TextStyle;
  secondary: ViewStyle;
  secondaryText: TextStyle;
}

// 🟩 Buttons
export const BUTTON: ButtonStyles = {
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    // shadow (iOS only)
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
  },
  secondaryText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "600",
  },
};

// 📏 Spacing
export const SPACING = {
  xs: 6,
  s: 10,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};
