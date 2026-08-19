import { Platform } from "react-native";

export const FontFamily = {
  regular: Platform.select({
    ios: "Alkatra_400Regular",
    android: "Alkatra_400Regular",
    web: "Alkatra_400Regular",
    default: "Alkatra_400Regular",
  }),

  medium: Platform.select({
    ios: "Alkatra_400Regular",
    android: "Alkatra_400Regular",
    web: "Alkatra_400Regular",
    default: "Alkatra_400Regular",
  }),

  semibold: Platform.select({
    ios: "Alkatra_400Regular",
    android: "Alkatra_400Regular",
    web: "Alkatra_400Regular",
    default: "Alkatra_400Regular",
  }),

  bold: Platform.select({
    ios: "Alkatra_400Regular",
    android: "Alkatra_400Regular",
    web: "Alkatra_400Regular",
    default: "Alkatra_400Regular",
  }),

  italic: Platform.select({
    ios: "Alkatra_400Regular",
    android: "Alkatra_400Regular",
    web: "Alkatra_400Regular",
    default: "Alkatra_400Regular",
  }),
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};