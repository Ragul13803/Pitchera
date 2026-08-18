import { Platform } from "react-native";

export const FontFamily = {
  regular: Platform.select({
    ios: "CormorantRegular",
    android: "CormorantRegular",
    web: "CormorantRegular",
    default: "CormorantRegular",
  }),

  medium: Platform.select({
    ios: "CormorantMedium",
    android: "CormorantMedium",
    web: "CormorantMedium",
    default: "CormorantMedium",
  }),

  semibold: Platform.select({
    ios: "CormorantSemiBold",
    android: "CormorantSemiBold",
    web: "CormorantSemiBold",
    default: "CormorantSemiBold",
  }),

  bold: Platform.select({
    ios: "CormorantBold",
    android: "CormorantBold",
    web: "CormorantBold",
    default: "CormorantBold",
  }),

  italic: Platform.select({
    ios: "CormorantItalic",
    android: "CormorantItalic",
    web: "CormorantItalic",
    default: "CormorantItalic",
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