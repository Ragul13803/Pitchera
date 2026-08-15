import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Title */}
          <Text style={styles.title}>
            {title}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelText}>
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

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    borderWidth: 1,
    borderColor: "#EFC1C1",

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

    color: "#9F2B2B",
  },

  /* ================================
     MESSAGE
  ================================= */

  message: {
    marginTop: 8,

    fontSize: 14,

    lineHeight: 20,

    color: "#444444",
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

    borderColor: "#D1D5DB",

    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 12,

    fontWeight: "700",

    color: "#374151",
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