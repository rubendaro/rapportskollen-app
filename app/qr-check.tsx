import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

export default function QrCheck() {
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({ addresses: [], services: [] });

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);

  const [currentAddress, setCurrentAddress] = useState("");

  // ✅ Load session automatically
  useEffect(() => {
    const init = async () => {
      // Validate session
      const session = await checkSession();

      if (!session || !session.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        return router.replace("/login");
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      const rid = String(session.user_id);

      if (!token) {
        Alert.alert("Fel", "Ingen QR-data");
        return router.back();
      }

      await fetchQrData(rid, sessionId, token);
    };

    init();
  }, [token]);

  // ✅ Query backend for the QR code info
  const fetchQrData = async (rid: string, sessionId: string | null, qrToken: any) => {
    try {
      const body =
        `session_id=${encodeURIComponent(sessionId ?? "")}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&token=${encodeURIComponent(qrToken)}`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/check_add_qr.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );

      const text = await res.text();
      console.log("✅ QR check_add_qr.php →", text);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        return Alert.alert("Fel", "Ogiltigt svar från servern.");
      }

      if (!Array.isArray(data.addresses) || data.addresses.length === 0) {
        Alert.alert("Ogiltig QR-kod", "Ingen adress kopplad till QR-taggen");
        return;
      }

      setFormData(data);
      setCheckStatus(Number(data.Checkstatus ?? 0));
      setChid(Number(data.CHID ?? 0));

      // Save for "checkedAddress" banner
      setCurrentAddress(data.addresses[0]?.Address ?? "");
    } catch (err) {
      console.log(err);
      Alert.alert("Fel", "Kunde inte läsa QR-data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Check-in / Check-out
  const handleCheck = async () => {
    const session = await checkSession();
    if (!session || !session.user_id) {
      return Alert.alert("Session saknas", "Logga in igen.");
    }

    const rid = String(session.user_id);
    const sessionId = await SecureStore.getItemAsync("phpSessionId");

    if (!selectedAddress) return Alert.alert("Välj adress");
    const isCheckInState =
      checkStatus === 3 || checkStatus === null || checkStatus === 0;

    if (isCheckInState && !selectedService) {
      return Alert.alert("Välj tjänst");
    }

    const body = new URLSearchParams();
    body.append("session_id", sessionId ?? "");
    body.append("rid", rid);
    body.append("PRID", selectedAddress);

    if (isCheckInState) body.append("RSPID", selectedService);
    if (chid !== null) body.append("CHID", String(chid));

    const url =
      checkStatus === 1
        ? "https://rapportskollen.com/mobile/checkout.php"
        : "https://rapportskollen.com/mobile/checkin.php";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const text = await res.text();
      console.log("✅ QR check response:", text);

      let json;
      try {
        json = JSON.parse(text.trim());
      } catch {
        return Alert.alert("Fel", "Ogiltigt svar från servern.");
      }

      if (json.success) {
        // ✅ Store in banner
        if (checkStatus === 1) {
          await SecureStore.deleteItemAsync("checkedAddress");
        } else {
          await SecureStore.setItemAsync("checkedAddress", currentAddress);
        }

        router.replace("/(tabs)");
        return;
      }

      Alert.alert("Fel", json.message || "Misslyckades");
    } catch (err) {
      console.log(err);
      Alert.alert("Fel", "Något gick fel.");
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📋 QR Detaljer</Text>

      <Text style={styles.sectionTitle}>Välj Adress</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={selectedAddress} onValueChange={setSelectedAddress}>
          <Picker.Item label="Välj adress..." value="" />
          {formData.addresses?.map((a: any, i: number) => (
            <Picker.Item
              key={i}
              label={`${a.Address} • ${a.PRID}`}
              value={a.PRID}
            />
          ))}
        </Picker>
      </View>

      {isCheckInState && (
        <>
          <Text style={styles.sectionTitle}>Välj Tjänst</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedService} onValueChange={setSelectedService}>
              <Picker.Item label="Välj tjänst..." value="" />
              {formData.services?.map((s: any, i: number) => (
                <Picker.Item key={i} label={s.Service} value={s.RSPID} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleCheck}>
        <Text style={styles.submitText}>
          {checkStatus === 1 ? "Checka ut" : "Checka in"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
