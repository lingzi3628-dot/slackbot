/**
 * Biometric lock hook — wraps expo-local-authentication.
 *
 * Exposes:
 *  - `available`: whether the device supports biometrics / passcode
 *  - `enrolled`: whether the user has biometrics set up
 *  - `authenticate()`: prompts Face ID / Touch ID / fingerprint
 *
 * Used by the lock screen (`app/lock.tsx`) and the Settings toggle.
 */
import { useCallback, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricState {
  available: boolean;
  enrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export function useBiometricLock() {
  const [state, setState] = useState<BiometricState>({
    available: false,
    enrolled: false,
    supportedTypes: [],
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (!mounted) return;
        setState({
          available: hasHardware,
          enrolled: isEnrolled,
          supportedTypes: types,
        });
      } catch {
        /* biometrics not available */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = useCallback(
    async (reason = "Unlock SPYRO V1"): Promise<boolean> => {
      if (!state.available || !state.enrolled) return false;
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: "Use Passcode",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });
        return result.success;
      } catch {
        return false;
      }
    },
    [state.available, state.enrolled]
  );

  return { ...state, authenticate };
}
