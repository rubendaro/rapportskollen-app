import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

export default function PlatsPage() {
  const theme = useTheme();
  const router = useRouter();

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await checkSession();
        if (!session?.user_id) {
          Alert.alert("Session saknas", "Logga in igen");
          router.replace("/login");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Behörighet saknas", "Platsbehörighet krävs.");
          router.back();
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        setCoords({ lat, lon });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "RapportskollenApp/1.0",
            },
          }
        );

        const data = await res.json();
        setAddress(data?.display_name ?? "Okänd adress");
      } catch {
        Alert.alert("Fel", "Kunde inte hämta plats");
      }

      setLoading(false);
    })();
  }, []);

  const handleSend = async () => {
    if (!coords || !address) return;

    const session = await checkSession();
    if (!session?.user_id) {
      Alert.alert("Session saknas", "Logga in igen");
      router.replace("/login");
      return;
    }

    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    const rid = String(session.user_id);

    const body =
      `session_id=${encodeURIComponent(sessionId ?? "")}` +
      `&add=${encodeURIComponent(address)}` +
      `&lat=${encodeURIComponent(coords.lat)}` +
      `&lon=${encodeURIComponent(coords.lon)}` +
      `&rid=${encodeURIComponent(rid)}`;

    try {
      await fetch("https://rapportskollen.com/gps/my_position_do.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      Alert.alert("Klart", "Din plats har skickats.");
      router.back();
    } catch {
      Alert.alert("Fel", "Kunde inte skicka platsen.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.COLORS.background },
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <Text style={[styles.text, { color: theme.COLORS.text, marginTop: 10 }]}>
            Laddar platsinformation...
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: theme.COLORS.secondary }]}>
            📍 Min plats
          </Text>

          <Text style={[styles.text, { color: theme.COLORS.text }]}>
            Lat: {coords?.lat.toFixed(6) ?? "N/A"}
          </Text>

          <Text style={[styles.text, { color: theme.COLORS.text }]}>
            Lon: {coords?.lon.toFixed(6) ?? "N/A"}
          </Text>

          <Text style={[styles.text, { marginTop: 10, color: theme.COLORS.textSecondary }]}>
            {address ?? ""}
          </Text>

          <TouchableOpacity
            style={[theme.BUTTON.primary, { marginTop: 40 }]}
            onPress={handleSend}
          >
            <Text style={theme.BUTTON.primaryText}>Skicka till admin</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    width: "100%",
  },
});
