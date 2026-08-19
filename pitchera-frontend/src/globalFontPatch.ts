import { Text, TextInput } from "react-native";

const FONT_REGULAR = "Alkatra_400Regular";

let patched = false;

export function applyGlobalFontPatch() {
  if (patched) return;

  patched = true;

  const originalTextRender = (Text as any).render;
  const originalTextInputRender = (TextInput as any).render;

  if (originalTextRender) {
    (Text as any).render = function (props: any, ref: any) {
      const style = Array.isArray(props.style)
        ? props.style
        : [props.style];

      return originalTextRender.call(this, {
        ...props,
        style: [
          {
            fontFamily: FONT_REGULAR,
          },
          ...style,
        ],
        ref,
      });
    };
  }

  if (originalTextInputRender) {
    (TextInput as any).render = function (props: any, ref: any) {
      const style = Array.isArray(props.style)
        ? props.style
        : [props.style];

      return originalTextInputRender.call(this, {
        ...props,
        style: [
          {
            fontFamily: FONT_REGULAR,
          },
          ...style,
        ],
        ref,
      });
    };
  }
}