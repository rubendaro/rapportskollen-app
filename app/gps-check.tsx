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
import { COLORS } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

type AddressOption = { PRID: string; Address: string };
type ServiceOption = { RSPID: string; Service: string };

export default function GPSCheckScreen() {
  const router = useRouter();

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
        const rid = String(session.user_id);
        const paid = session.manual ?? 0;

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
              `&rid=${encodeURIComponent(rid)}` +
              `&paid=${encodeURIComponent(paid)}` +
              `&address=${encodeURIComponent(streetName)}` +
              `&lat=${encodeURIComponent(latitude)}` +
              `&lon=${encodeURIComponent(longitude)}`,
          }
        );

        const txt = await res.text();
        console.log("display_project_and_services.php →", txt);

        let data: any = {};
        try {
          data = JSON.parse(txt);
        } catch {}

        const addr = data.addresses || [];
        setAddresses(addr);
        setServices(data.services || []);

        if (addr.length === 0) {
          setAddressWarning("Ingen adress hittades för din GPS-position.");
        } else {
          setAddressWarning(null);
        }

        setCheckStatus(
          data.Checkstatus !== undefined && data.Checkstatus !== null
            ? Number(data.Checkstatus)
            : null
        );

        // ✅ Safe CHID parsing
        setChid(
          data.CHID !== undefined &&
          data.CHID !== null &&
          data.CHID !== ""
            ? Number(data.CHID)
            : null
        );

      } catch (err) {
        console.error(err);
        Alert.alert("Fel", "Kunde inte hämta plats eller data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCheckIn = async () => {
    if (!selectedAddress) {
      Alert.alert("Välj projekt", "Du måste välja ett PRID.");
      return;
    }

    const isCheckInState =
      checkStatus === 3 || checkStatus === null || checkStatus === 0;

    if (isCheckInState && !selectedService) {
      Alert.alert("Välj service", "Du måste välja en service.");
      return;
    }

    try {
      const session = await checkSession();
      if (!session?.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        router.replace("/login");
        return;
      }

      const rid = String(session.user_id);
      const sessionId = await SecureStore.getItemAsync("phpSessionId");

      console.log("Submitting PRID:", selectedAddress);
      console.log("Submitting RSPID:", selectedService);
      console.log("Using PHPSESSID:", sessionId);

      const form = new URLSearchParams();
      form.append("session_id", sessionId ?? "");
      form.append("rid", rid);
      form.append("PRID", selectedAddress);
      if (isCheckInState) form.append("RSPID", selectedService);
      if (chid !== null) form.append("CHID", String(chid));

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
        if (checkStatus === 1) {
          await SecureStore.deleteItemAsync("checkedAddress");
        } else {
          const addrName =
            addresses.find((a) => a.PRID === selectedAddress)?.Address || "";
          await SecureStore.setItemAsync("checkedAddress", addrName);
        }

        Alert.alert("Klart", json.message || "Inskickat");
        router.replace("/(tabs)");
        return;
      }

      Alert.alert("Fel", json.message || "Misslyckades att skicka");
    } catch (err) {
      console.error(err);
      Alert.alert("Fel", "Ett fel uppstod vid inlämning");
    }
  };

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  const buttonText = checkStatus === 1 ? "Checka ut" : "Checka in";

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Laddar platsinformation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>GPS Check</Text>
      {road && <Text style={styles.address}>{road}</Text>}

      {addressWarning && (
        <Text style={styles.warningText}>{addressWarning}</Text>
      )}

      <Text style={styles.label}>Välj Address / Projekt:</Text>

      <Picker
        selectedValue={selectedAddress}
        onValueChange={(val) => {
          console.log("Selected PRID:", val);
          setSelectedAddress(String(val));
        }}
        style={styles.picker}
        enabled={addresses.length > 0}
      >
        <Picker.Item label="-- Välj adress --" value="" />
        {addresses.map((a, i) => (
          <Picker.Item key={i} label={a.Address} value={a.PRID} />
        ))}
      </Picker>

      {isCheckInState && addresses.length > 0 && (
        <View>
          <Text style={styles.label}>Välj service:</Text>

          <Picker
            selectedValue={selectedService}
            onValueChange={(val) => {
              console.log("Selected RSPID:", val);
              setSelectedService(String(val));
            }}
            style={styles.picker}
          >
            <Picker.Item label="-- Välj service --" value="" />
            {services.map((s, i) => (
              <Picker.Item key={i} label={s.Service} value={s.RSPID} />
            ))}
          </Picker>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleCheckIn}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  address: { marginBottom: 15, color: COLORS.primary },
  picker: { marginVertical: 10, backgroundColor: "#f5f5f5" },
  label: { fontWeight: "600", marginTop: 10 },
  warningText: { color: "red", fontWeight: "600", marginBottom: 10 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
