// components/ColorText.js
import React from 'react';
import { Text } from 'react-native';
import COLORS from '../../utils/colors';

export default function ColorText({ children, color = 'primary', style, ...props }) {
  return (
    <Text
      style={[
        { color: COLORS[color] || COLORS.primary },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}