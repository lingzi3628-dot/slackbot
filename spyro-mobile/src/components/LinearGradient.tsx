/**
 * Thin gradient wrapper around expo-linear-gradient so components can import
 * a single consistent API (`colors`, `style`, `children`).
 */
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import type { StyleProp, ViewStyle } from "react-native";
import type { ReactNode } from "react";

interface LinearGradientProps {
  colors: string[];
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function LinearGradient({
  colors,
  style,
  children,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: LinearGradientProps) {
  return (
    <ExpoLinearGradient colors={colors} style={style} start={start} end={end}>
      {children}
    </ExpoLinearGradient>
  );
}
