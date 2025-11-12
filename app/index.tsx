import { Redirect, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      console.log("📤 Stored session ID at startup:", sessionId);

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
        console.log("📥 Session check raw response:", text);

        const data = JSON.parse(text);
        setIsLoggedIn(data.success === true);
      } catch (err) {
        console.log("❌ Session check error:", err);
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      {isLoggedIn ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />}

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.secondary,
          headerTitleStyle: {
            fontWeight: "700",
            color: COLORS.secondary,
            fontSize: 20,
          },
          headerTitleAlign: "center",
        }}
      />
    </>
  );
}
