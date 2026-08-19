import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  label: string;
  value?: string;
  onChange: (isoDate: string) => void;
};

export default function DateField({
  label,
  value,
  onChange,
}: Props) {
  const { colors } = useTheme();
  const pickerRef = useRef<HTMLInputElement>(null);

  // datetime-local expects:
  // YYYY-MM-DDTHH:mm
  const inputValue = value
    ? new Date(value).toISOString().slice(0, 16)
    : '';

  const displayDate = value
    ? new Date(value).toLocaleDateString('en-CA')
    : 'Select date';

  const displayTime = value
    ? new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Select time';

  const openPicker = () => {
    if (!pickerRef.current) return;

    const input = pickerRef.current as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  return (
    <View>
      <Text style={{ marginBottom: 4, fontSize: 14, color: colors.textSecondary }}>
        {label}
      </Text>

      <Pressable
        onPress={openPicker}
        className="flex-row items-center rounded-xl px-3 py-2"
        style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
      >
        <MaterialCommunityIcons
          name="calendar-clock-outline"
          size={16}
          color={colors.textSecondary}
        />

        <View className="ml-2 flex-row items-center gap-2">
          <Text style={{ fontSize: 12, color: colors.text }}>
            {displayDate} &
          </Text>

          <Text style={{ fontSize: 12, color: colors.text }}>
            {displayTime}
          </Text>
        </View>
      </Pressable>

      <input
        ref={pickerRef}
        type="datetime-local"
        value={inputValue}
        onChange={(e) => {
          const selected = e.target.value;

          if (!selected) {
            onChange('');
            return;
          }

          onChange(
            new Date(selected).toISOString()
          );
        }}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />
    </View>
  );
}