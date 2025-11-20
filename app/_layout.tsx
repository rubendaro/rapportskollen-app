import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useURL } from "expo-linking";
import { COLORS } from "../constants/theme";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] = useState("login");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [lockedDeepLink, setLockedDeepLink] = useState(false);
  const url = useURL();

  // ✅ Deep link detection
  useEffect(() => {
    if (!url || lockedDeepLink) return;

    if (!url.includes("expo-development-client") &&
        url.startsWith("rapportskollenapp://nfc")) 
    {
      console.log("📡 NFC deep link → start in nfc-check");
      setInitialRoute("nfc-check");
      setLockedDeepLink(true);
      return;
    }

    console.log("🚀 Normal app start");
  }, [url, lockedDeepLink]);

  // ✅ Restore session & manual
  useEffect(() => {
    const checkSession = async () => {
      const sessionId = await SecureStore.getItemAsync("phpSessionId");

      if (!sessionId) {
        console.log("⚠️ No stored session");
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
        console.log("📥 Session check response:", data);

        if (data.success) {
          if (data.manual !== undefined) {
            await SecureStore.setItemAsync("userManual", String(data.manual));
            console.log("✅ Updated manual from server:", data.manual);
          }
          setIsLoggedIn(true);
        } else {
          console.log("❌ Invalid session — wiping values");
          
          const keys = ["phpSessionId","userManual","userID","userName","checkedAddress"];
          for (const key of keys) await SecureStore.deleteItemAsync(key);

          setIsLoggedIn(false);
        }
      } catch (err) {
        console.log("🚨 Session check error:", err);
        await SecureStore.deleteItemAsync("userManual");
        setIsLoggedIn(false);
      }

      setSessionChecked(true);
    };

    if (!sessionChecked && initialRoute !== "nfc-check") checkSession();
  }, [initialRoute, sessionChecked]);

  // ✅ Splash screen
  if (!sessionChecked && initialRoute !== "nfc-check") {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
      <SafeAreaView style={{ flex: 1 }}>
        <Stack initialRouteName={startPage}>
          
          {/* ❌ Hide header ONLY on login */}
          <Stack.Screen name="login" options={{ headerShown: false }} />

          {/* ❌ Hide header ONLY on tab home */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* ✅ NFC screen keeps header & back button */}
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
