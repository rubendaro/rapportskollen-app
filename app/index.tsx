import { Redirect, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function RootLayout() {
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = await SecureStore.getItemAsync("phpSessionId");

      if (!sessionId) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const res = await fetch(
          "https://rapportskollen.com/mobile/session_check.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `session_id=${encodeURIComponent(sessionId)}`,
          }
        );

        const text = await res.text();
        const data = JSON.parse(text);

        setIsLoggedIn(data.success === true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

  // splash
  if (isLoggedIn === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
        <Text style={{ color: theme.COLORS.text, marginTop: 8 }}>
          Kontrollerar session…
        </Text>
      </View>
    );
  }

  return (
    <>
      {isLoggedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />}

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.COLORS.card },
          headerTintColor: theme.COLORS.primary,
          headerTitleStyle: {
            fontWeight: "700",
            color: theme.COLORS.text,
            fontSize: 20,
          },
          headerTitleAlign: "center",
        }}
      />
    </>
  );
}
