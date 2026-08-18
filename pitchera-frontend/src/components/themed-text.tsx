import { StyleSheet, Text, type TextProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";

  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      {...rest}
      style={[
        {
          color: theme[themeColor ?? "text"],
        },

        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "linkPrimary" && styles.linkPrimary,
        type === "code" && styles.code,

        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: "CormorantMedium",
    fontSize: 16,
    lineHeight: 24,
  },

  small: {
    fontFamily: "CormorantRegular",
    fontSize: 18,
    lineHeight: 20,
  },

  smallBold: {
    fontFamily: "CormorantBold",
    fontSize: 18,
    lineHeight: 20,
  },

  title: {
    fontFamily: "CormorantSemiBold",
    fontSize: 48,
    lineHeight: 52,
  },

  subtitle: {
    fontFamily: "CormorantSemiBold",
    fontSize: 36,
    lineHeight: 44,
  },

  link: {
    fontFamily: "CormorantRegular",
    lineHeight: 30,
    fontSize: 14,
  },

  linkPrimary: {
    fontFamily: "CormorantMedium",
    lineHeight: 30,
    fontSize: 14,
    color: "#3c87f7",
  },

  code: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});