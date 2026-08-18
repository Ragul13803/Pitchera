// src/components/forms/DateField.web.tsx

import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const pickerRef = useRef<HTMLInputElement>(null);

  const dateValue = value ? value.substring(0, 10) : '';

  const openPicker = () => {
    if (!pickerRef.current) return;

    if ('showPicker' in pickerRef.current) {
      (pickerRef.current as any).showPicker();
    } else {
      pickerRef.current.click();
    }
  };


  return (
    <View>

      <Text className="mb-1 text-xs font-semibold text-[#60717d]">
        {label}
      </Text>


      <View style={{ position: 'relative' }}>

        <Pressable
          onPress={openPicker}
          className="
            flex-row
            items-center
            rounded-xl
            border
            border-[#d7d7d7]
            bg-white
            px-3
            py-2
          "
        >

          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={16}
            color="#60717d"
          />


          <Text
            className={`
              ml-2
              text-sm
              ${
                dateValue
                  ? 'text-[#243440]'
                  : 'text-[#9ca3af]'
              }
            `}
          >
            {dateValue || 'Select date'}
          </Text>

        </Pressable>


        <input
          ref={pickerRef}
          type="date"
          value={dateValue}
          onChange={(e) => {

            const selectedDate = e.target.value;

            if (!selectedDate) {
              onChange('');
              return;
            }


            onChange(
              new Date(
                `${selectedDate}T00:00:00`
              ).toISOString()
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

    </View>
  );
}