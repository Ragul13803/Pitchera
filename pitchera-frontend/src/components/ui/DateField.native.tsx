import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  label: string;
  value?: string;
  onChange: (isoDate: string) => void;
};

export default function DateField({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<'date' | 'time' | null>(null);

  const selected = value ? new Date(value) : new Date();

  const dateText = value
    ? selected.toLocaleDateString('en-CA')
    : 'Select date';

  const timeText = value
    ? selected.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Select time';

  const handleChange = (
    event: DateTimePickerEvent,
    date?: Date,
  ) => {
    if (event.type !== 'set' || !date) {
      setOpen(null);
      return;
    }

    if (open === 'date') {
      // Keep the existing time when changing the date
      const updated = new Date(selected);

      updated.setFullYear(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );

      onChange(updated.toISOString());

      // Then open time picker
      setOpen('time');
    } else {
      // Keep the existing date when changing the time
      const updated = new Date(selected);

      updated.setHours(
        date.getHours(),
        date.getMinutes(),
        0,
        0,
      );

      onChange(updated.toISOString());
      setOpen(null);
    }
  };

  return (
    <View>
      <Text style={{ marginBottom: 4, fontSize: 12, color: colors.textSecondary }}>
        {label}
      </Text>

      <View className="flex-row gap-2">
        {/* Date */}
        <Pressable
          onPress={() => setOpen('date')}
          className="flex-1 rounded-xl px-3 py-2"
          style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={{ fontSize: 12, color: colors.text }}>
              {dateText}
            </Text>
          </View>
        </Pressable>

        {/* Time */}
        <Pressable
          onPress={() => setOpen('time')}
          className="flex-1 rounded-xl px-3 py-2"
          style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={{ fontSize: 12, color: colors.text }}>
              {timeText}
            </Text>
          </View>
        </Pressable>
      </View>

      {open ? (
        <DateTimePicker
          value={selected}
          mode={open}
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}