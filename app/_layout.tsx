import { useURL } from "expo-linking";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../constants/theme";

export default function RootLayout() {
  const theme = useTheme();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState("login");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [lockedDeepLink, setLockedDeepLink] = useState(false);
  const url = useURL();

  // Deep link detect
  useEffect(() => {
    if (!url || lockedDeepLink) return;

    if (
      !url.includes("expo-development-client") &&
      url.startsWith("rapportskollenapp://nfc")
    ) {
      setInitialRoute("nfc-check");
      setLockedDeepLink(true);
      return;
    }
  }, [url, lockedDeepLink]);

  // Restore session
  useEffect(() => {
    const checkSession = async () => {
      const sessionId = await SecureStore.getItemAsync("phpSessionId");

      if (!sessionId) {
        setIsLoggedIn(false);
        setSessionChecked(true);
        return;
      }

      try {
        const res = await fetch("https://rapportskollen.com/api/protected.php", {
          headers: {
            "Content-Type": "application/json",
            Cookie: `PHPSESSID=${sessionId}`,
          },
        });

        const text = await res.text();
        const data = JSON.parse(text);

        if (data.success) {
          if (data.manual !== undefined) {
            await SecureStore.setItemAsync("userManual", String(data.manual));
          }
          setIsLoggedIn(true);
        } else {
          const keys = ["phpSessionId", "userManual", "userID", "userName", "checkedAddress"];
          for (const key of keys) await SecureStore.deleteItemAsync(key);

          setIsLoggedIn(false);
        }
      } catch {
        await SecureStore.deleteItemAsync("userManual");
        setIsLoggedIn(false);
      }

      setSessionChecked(true);
    };

    if (!sessionChecked && initialRoute !== "nfc-check") checkSession();
  }, [initialRoute, sessionChecked]);

  // Splash screen
  if (!sessionChecked && initialRoute !== "nfc-check") {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.COLORS.background,
          }}
        >
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const startPage =
    initialRoute === "nfc-check"
      ? "nfc-check"
      : isLoggedIn
      ? "(tabs)"
      : "login";

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.background }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.COLORS.background,
            },
            headerTintColor: theme.COLORS.text,
          }}
          initialRouteName={startPage}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />

          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="nfc-check"
            options={{
              headerShown: true,
              title: "📡 NFC Kontroll",
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
