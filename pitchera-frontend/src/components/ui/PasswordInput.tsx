import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { Colors } from '@/constants/theme';

interface PasswordInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  onBlur?: () => void;
}

export function PasswordInput({
  label,
  error,
  value,
  onChangeText,
  placeholder,
  required,
  onBlur,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      label={label}
      error={error}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={!visible}
      required={required}
      onBlur={onBlur}
      rightIcon={
        <TouchableOpacity
          onPress={() => setVisible(!visible)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.gray400}
          />
        </TouchableOpacity>
      }
    />
  );
}