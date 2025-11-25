// constants/theme.ts
import { TextStyle, ViewStyle, useColorScheme } from "react-native";

/* ---------------------------------- */
/* SPACING                            */
/* ---------------------------------- */
export const SPACING = {
  xs: 6,
  s: 10,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

/* ---------------------------------- */
/* COLORS (LIGHT / DARK)              */
/* ---------------------------------- */

const LIGHT_COLORS = {
  primary: "#7EB734",
  secondary: "#1E1E1E",
  background: "#F4F4F4",
  card: "#FFFFFF",
  text: "#1E1E1E",
  textSecondary: "#4A4A4A",
  border: "#E3E3E3",
  gray: "#9E9E9E",
  white: "#FFFFFF",

  error: "#E53935",
  success: "#4CAF50",
};

const DARK_COLORS = {
  primary: "#7EB734",
  secondary: "#FFFFFF",
  background: "#0F0F0F",
  card: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#C7C7C7",
  border: "#2A2A2A",
  gray: "#8A8A8A",
  white: "#FFFFFF",

  error: "#E53935",
  success: "#4CAF50",
};

/* ---------------------------------- */
/* INTERFACES                         */
/* ---------------------------------- */

export interface Theme {
  COLORS: typeof LIGHT_COLORS;
  FONT: {
    title: TextStyle;
    subtitle: TextStyle;
    body: TextStyle;
    small: TextStyle;
  };
  BUTTON: {
    primary: ViewStyle;
    primaryText: TextStyle;
    secondary: ViewStyle;
    secondaryText: TextStyle;
  };
  SPACING: typeof SPACING;
}

/* ---------------------------------- */
/* LIGHT THEME                        */
/* ---------------------------------- */

const LIGHT_THEME: Theme = {
  COLORS: LIGHT_COLORS,

  FONT: {
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: LIGHT_COLORS.primary,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: "600",
      color: LIGHT_COLORS.text,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      color: LIGHT_COLORS.textSecondary,
    },
    small: {
      fontSize: 14,
      color: LIGHT_COLORS.gray,
    },
  },

  BUTTON: {
    primary: {
      backgroundColor: LIGHT_COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 30,
      alignItems: "center",
    },
    primaryText: {
      color: LIGHT_COLORS.white,
      fontSize: 18,
      fontWeight: "600",
    },

    secondary: {
      backgroundColor: LIGHT_COLORS.white,
      borderWidth: 1,
      borderColor: LIGHT_COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 30,
      alignItems: "center",
    },
    secondaryText: {
      color: LIGHT_COLORS.primary,
      fontSize: 18,
      fontWeight: "600",
    },
  },

  SPACING,
};

/* ---------------------------------- */
/* DARK THEME                         */
/* ---------------------------------- */

const DARK_THEME: Theme = {
  COLORS: DARK_COLORS,

  FONT: {
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: DARK_COLORS.primary,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: "600",
      color: DARK_COLORS.text,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      color: DARK_COLORS.textSecondary,
    },
    small: {
      fontSize: 14,
      color: DARK_COLORS.gray,
    },
  },

  BUTTON: {
    primary: {
      backgroundColor: DARK_COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 30,
      alignItems: "center",
    },
    primaryText: {
      color: DARK_COLORS.white,
      fontSize: 18,
      fontWeight: "600",
    },

    secondary: {
      backgroundColor: DARK_COLORS.card,
      borderWidth: 1,
      borderColor: DARK_COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 30,
      alignItems: "center",
    },
    secondaryText: {
      color: DARK_COLORS.primary,
      fontSize: 18,
      fontWeight: "600",
    },
  },

  SPACING,
};

/* ---------------------------------- */
/* THEME SWITCHER                     */
/* ---------------------------------- */
export const useTheme = () => {
  const scheme = useColorScheme();
  return scheme === "dark" ? DARK_THEME : LIGHT_THEME;
};

/* ---------------------------------- */
/* OPTIONAL named exports for legacy  */
/*  (only use in static cases)        */
/* ---------------------------------- */
export const COLORS = LIGHT_COLORS;
export const FONT = LIGHT_THEME.FONT;
export const BUTTON = LIGHT_THEME.BUTTON;
