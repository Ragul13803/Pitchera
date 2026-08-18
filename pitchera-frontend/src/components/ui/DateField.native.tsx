import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  label: string;
  value?: string;
  onChange: (isoDate: string) => void;
};

export default function DateField({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : new Date();

  // formats as yyyy-mm-dd
  const displayText = value
    ? selected.toLocaleDateString('en-CA') 
    : 'Select date';

  return (
    <View>
      <Text className="mb-1 text-xs font-semibold text-[#60717d]">{label}</Text>
      <Pressable onPress={() => setOpen(true)} className="rounded-xl border border-[#d7d7d7] bg-white px-3 py-2">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#60717d" />
          <Text className="text-sm text-[#243440]">{displayText}</Text>
        </View>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setOpen(false);
            if (event.type === 'set' && date) onChange(date.toISOString());
          }}
        />
      ) : null}
    </View>
  );
}