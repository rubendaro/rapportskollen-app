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
import { BUTTON } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

export default function PlatsPage() {
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log("🚀 PlatsPage mounted");

        // ✅ Validate session
        const session = await checkSession();
        if (!session || !session.user_id) {
          Alert.alert("Session saknas", "Logga in igen");
          router.replace("/login");
          return;
        }

        // ✅ Location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Behörighet saknas", "Platsbehörighet krävs.");
          router.back();
          return;
        }

        // ✅ Get GPS
        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        setCoords({ lat, lon });

        // ✅ Reverse geocode using OpenStreetMap
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "RapportskollenApp/1.0 (support@rapportskollen.com)",
            },
          }
        );

        const data = await res.json();
        setAddress(data?.display_name ?? "Okänd adress");
      } catch (err) {
        console.log("❌ Location fetch error:", err);
        Alert.alert("Fel", "Kunde inte hämta plats");
      }

      setLoading(false);
    })();
  }, []);

  // ✅ SEND COORDINATES TO BACKEND (session_id used)
  const handleSend = async () => {
    if (!coords || !address) return;

    // ✅ Validate session before sending
    const session = await checkSession();
    if (!session || !session.user_id) {
      Alert.alert("Session saknas", "Logga in igen");
      router.replace("/login");
      return;
    }

    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    const rid = String(session.user_id);

    // ✅ URL-encoded POST (NO FormData)
    const body =
      `session_id=${encodeURIComponent(sessionId ?? "")}` +
      `&add=${encodeURIComponent(address)}` +
      `&lat=${encodeURIComponent(coords.lat)}` +
      `&lon=${encodeURIComponent(coords.lon)}` +
      `&rid=${encodeURIComponent(rid)}`;

    try {
      const response = await fetch(
        "https://rapportskollen.com/gps/my_position_do.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const text = await response.text();
      console.log("📡 Server response:", text);

      Alert.alert("✅ Plats skickad", "Din plats har skickats till backend.");
      router.back();
    } catch (error) {
      console.log("❌ Send error:", error);
      Alert.alert("Fel", "Kunde inte skicka platsen.");
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={BUTTON.primary.backgroundColor} />
          <Text style={{ marginTop: 10 }}>Laddar platsinformation...</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>📍 Min plats</Text>

          <Text style={styles.text}>
            Lat: {coords ? coords.lat.toFixed(6) : "N/A"}
          </Text>
          <Text style={styles.text}>
            Lon: {coords ? coords.lon.toFixed(6) : "N/A"}
          </Text>

          <Text style={[styles.text, { marginTop: 10 }]}>{address ?? ""}</Text>

          <View style={{ marginTop: 30, width: "100%" }}>
            <TouchableOpacity style={BUTTON.primary} onPress={handleSend}>
              <Text style={BUTTON.primaryText}>Skicka till admin</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
    textAlign: "center",
    width: "100%",
  },
  text: {
    color: "#000",
    fontSize: 18,
    textAlign: "center",
    width: "100%",
    marginTop: 4,
  },
});
