/**
 * SPYRO V1 dragon-flame mark — ported from the web SVG to react-native-svg.
 */
import * as React from "react";
import Svg, { Defs, LinearGradient, Stop, Path, Circle, RadialGradient } from "react-native-svg";
import { StyleSheet } from "react-native";

interface SpyroLogoProps {
  size?: number;
  withGlow?: boolean;
}

export function SpyroLogo({ size = 48, withGlow = false }: SpyroLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" style={withGlow ? styles.glow : undefined}>
      <Defs>
        <LinearGradient id="spyro-flame" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#ffe9a8" />
          <Stop offset="0.45" stopColor="#ff9a3c" />
          <Stop offset="1" stopColor="#e8421b" />
        </LinearGradient>
        <LinearGradient id="spyro-core" x1="32" y1="30" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#fff3cf" />
          <Stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      <Path
        d="M32 4c2.4 6.2.8 9.8-1.8 12.6-2.6 2.8-6 4.8-7.6 9.2-1.2 3.4-.4 6.8 1.2 9.4-2.2-1.2-4.4-3.4-5.2-6.6-1.2-4.8 1-9.2 1-9.2s-6.2 4-8.6 11.6C8.4 38.2 12 48 18.6 53.4 23.4 57 28 58.6 32 58.6s8.6-1.6 13.4-5.2C52 48 55.6 38.2 53 31.6c-2.4-7.6-8.6-11.6-8.6-11.6s2.2 4.4 1 9.2c-.8 3.2-3 5.4-5.2 6.6 1.6-2.6 2.4-6 1.2-9.4-1.6-4.4-5-6.4-7.6-9.2C31.2 13.8 29.6 10.2 32 4Z"
        fill="url(#spyro-flame)"
      />
      <Path
        d="M32 30c1.4 3.2.6 5.6-1 7.6-1.6 2-2.8 3.4-2.8 6 0 3.4 2.6 6.4 3.8 7.6 1.2-1.2 3.8-4.2 3.8-7.6 0-2.6-1.2-4-2.8-6-1.6-2-2.4-4.4-1-7.6Z"
        fill="url(#spyro-core)"
      />
      <Circle cx="26.5" cy="40" r="1.6" fill="#fff8e0" />
      <Circle cx="37.5" cy="40" r="1.6" fill="#fff8e0" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowColor: "#ff7a1a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
