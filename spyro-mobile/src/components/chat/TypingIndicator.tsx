/**
 * Flame-flicker typing indicator — three ember dots that pulse.
 */
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";

export function TypingIndicator() {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 180} color={theme.primary} />
      ))}
    </View>
  );
}

function Dot({ delay, color }: { delay: number; color: string }) {
  const sv = useSharedValue(0);

  useEffect(() => {
    // Start the flicker loop once on mount.
    sv.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 550, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 0.6 + sv.value * 0.4,
    transform: [{ translateY: -sv.value * 3 }, { scale: 1 + sv.value * 0.15 }],
  }));

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
