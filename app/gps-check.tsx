import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

type AddressOption = { PRID: string; Address: string };
type ServiceOption = { RSPID: string; Service: string };

export default function GPSCheckScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [road, setRoad] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);

  const [addressWarning, setAddressWarning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await checkSession();
        if (!session?.user_id) {
          Alert.alert("Session saknas", "Logga in igen");
          router.replace("/login");
          return;
        }

        const sessionId = await SecureStore.getItemAsync("phpSessionId");

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Behörighet nekad", "Appen kan inte hämta plats utan behörighet");
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

        let streetName = "Okänd väg";
        if (geocode.length > 0) {
          streetName = geocode[0].street || streetName;
        }
        setRoad(streetName);

        const res = await fetch(
          "https://rapportskollen.com/mobile/display_project_and_services.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:
              `session_id=${encodeURIComponent(sessionId ?? "")}` +
              `&rid=${encodeURIComponent(String(session.user_id))}` +
              `&paid=${encodeURIComponent(String(session.manual ?? 0))}` +
              `&address=${encodeURIComponent(streetName)}` +
              `&lat=${encodeURIComponent(latitude)}` +
              `&lon=${encodeURIComponent(longitude)}`,
          }
        );

        const txt = await res.text();
        let data: any = {};

        try {
          data = JSON.parse(txt);
        } catch {}

        setAddresses(data.addresses || []);
        setServices(data.services || []);

        setAddressWarning(
          data.addresses?.length === 0
            ? "Ingen adress hittades vid denna position."
            : null
        );

        setCheckStatus(
          data.Checkstatus !== undefined && data.Checkstatus !== null
            ? Number(data.Checkstatus)
            : null
        );

        setChid(
          data.CHID !== undefined && data.CHID !== null && data.CHID !== ""
            ? Number(data.CHID)
            : null
        );
      } catch {
        Alert.alert("Fel", "Kunde inte hämta platsinformation.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  const handleCheckIn = async () => {
    if (!selectedAddress) {
      Alert.alert("Välj projekt först");
      return;
    }

    if (isCheckInState && !selectedService) {
      Alert.alert("Välj service");
      return;
    }

    try {
      const session = await checkSession();
      if (!session?.user_id) return;

      const sessionId = await SecureStore.getItemAsync("phpSessionId");

      const form = new URLSearchParams();
      form.append("session_id", sessionId ?? "");
      form.append("rid", String(session.user_id));
      form.append("PRID", selectedAddress);

      if (isCheckInState) {
        form.append("RSPID", selectedService);
      }
      if (chid !== null) {
        form.append("CHID", String(chid));
      }

      const url =
        checkStatus === 1
          ? "https://rapportskollen.com/mobile/checkout.php"
          : "https://rapportskollen.com/mobile/checkin.php";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `PHPSESSID=${sessionId}`,
        },
        body: form.toString(),
      });

      const text = await res.text();
      const json = JSON.parse(text);

      if (json.success) {
        // ⭐ SAVE ADDRESS ON CHECK-IN
        if (checkStatus !== 1) {
          const addressName =
            addresses.find((a) => a.PRID == selectedAddress)?.Address || "";
          if (addressName) {
            await SecureStore.setItemAsync("checkedAddress", addressName);
          }
        }

        // ⭐ CLEAR ADDRESS ON CHECK-OUT
        if (checkStatus === 1) {
          await SecureStore.deleteItemAsync("checkedAddress");
        }

        Alert.alert("OK", json.message);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Fel", json.message || "Misslyckades");
      }
    } catch {
      Alert.alert("Fel", "Serverfel.");
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.COLORS.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
        <Text style={{ color: theme.COLORS.text, marginTop: 10 }}>
          Laddar GPS…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.COLORS.background },
      ]}
    >
      <Text style={[styles.header, { color: theme.COLORS.text }]}>
        GPS Check
      </Text>

      {road && (
        <Text style={[styles.address, { color: theme.COLORS.primary }]}>
          {road}
        </Text>
      )}

      {addressWarning && (
        <Text style={[styles.warningText, { color: theme.COLORS.error }]}>
          {addressWarning}
        </Text>
      )}

      <Text style={[styles.label, { color: theme.COLORS.text }]}>Välj projekt:</Text>

      <Picker
        selectedValue={selectedAddress}
        onValueChange={(v) => setSelectedAddress(String(v))}
        style={[styles.picker, { backgroundColor: theme.COLORS.card }]}
        dropdownIconColor={theme.COLORS.text}
      >
        <Picker.Item label="-- Välj adress --" value="" />
        {addresses.map((a, i) => (
          <Picker.Item key={i} label={a.Address} value={a.PRID} />
        ))}
      </Picker>

      {isCheckInState && addresses.length > 0 && (
        <>
          <Text style={[styles.label, { color: theme.COLORS.text }]}>Välj service:</Text>

          <Picker
            selectedValue={selectedService}
            onValueChange={(v) => setSelectedService(String(v))}
            style={[styles.picker, { backgroundColor: theme.COLORS.card }]}
            dropdownIconColor={theme.COLORS.text}
          >
            <Picker.Item label="-- Välj service --" value="" />
            {services.map((s, i) => (
              <Picker.Item key={i} label={s.Service} value={s.RSPID} />
            ))}
          </Picker>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.COLORS.primary },
        ]}
        onPress={handleCheckIn}
      >
        <Text style={styles.buttonText}>
          {checkStatus === 1 ? "Checka ut" : "Checka in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  address: { marginBottom: 15 },

  warningText: { fontWeight: "600", marginBottom: 12 },

  picker: { marginVertical: 10, borderRadius: 8 },

  label: { fontWeight: "600", marginTop: 10 },

  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: { color: "#fff", fontWeight: "700" },
});
