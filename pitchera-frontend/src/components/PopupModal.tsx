import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

type PopupModalProps = {
  visible: boolean;

  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  confirmBackgroundColor: string;

  onClose: () => void;
  onConfirm: () => void;
};

export default function PopupModal({
  visible,
  title,
  message,
  cancelText,
  confirmText,
  confirmBackgroundColor,
  onClose,
  onConfirm,
}: PopupModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                { borderColor: colors.border },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {cancelText}
              </Text>
            </Pressable>

            {/* Confirm */}
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: confirmBackgroundColor,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.confirmText}>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /* ================================
     MODAL OVERLAY
  ================================= */

  overlay: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "rgba(0, 0, 0, 0.40)",

    paddingHorizontal: 16,
  },

  /* ================================
     MODAL CARD
  ================================= */

  modalContainer: {
    width: "100%",
    maxWidth: 448,

    borderRadius: 16,

    borderWidth: 1,

    padding: 20,

    // Shadow - iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,

    // Shadow - Android
    elevation: 10,
  },

  /* ================================
     TITLE
  ================================= */

  title: {
    fontSize: 18,

    fontWeight: "800",
  },

  /* ================================
     MESSAGE
  ================================= */

  message: {
    marginTop: 8,

    fontSize: 14,

    lineHeight: 20,
  },

  /* ================================
     BUTTONS
  ================================= */

  buttonContainer: {
    marginTop: 20,

    flexDirection: "row",

    justifyContent: "flex-end",

    alignItems: "center",

    gap: 12,
  },

  /* ================================
     CANCEL BUTTON
  ================================= */

  cancelButton: {
    minHeight: 36,

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 999,

    borderWidth: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 12,

    fontWeight: "700",
  },

  /* ================================
     CONFIRM BUTTON
  ================================= */

  confirmButton: {
    minHeight: 36,

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 999,

    justifyContent: "center",
    alignItems: "center",
  },

  confirmText: {
    fontSize: 12,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  /* ================================
     PRESSED
  ================================= */

  buttonPressed: {
    opacity: 0.7,
  },
});