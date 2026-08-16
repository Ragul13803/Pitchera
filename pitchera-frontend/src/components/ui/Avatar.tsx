import { Colors } from '@/constants/theme';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  size?: number;
}

export function Avatar({
  uri,
  size = 40,
}: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{
          uri: uri,
        }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        resizeMode="cover"
        // onLoad={() => {
        //   console.log('Avatar loaded:', uri);
        // }}
        onError={(error) => {
          console.log(
            'Avatar failed to load:',
            error.nativeEvent
          );
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.gray200,
  },

  placeholder: {
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});