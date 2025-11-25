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
import { useTheme } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

export default function QrCheck() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({ addresses: [], services: [] });

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);

  const [currentAddress, setCurrentAddress] = useState("");

  useEffect(() => {
    const init = async () => {
      const session = await checkSession();
      if (!session?.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        return router.replace("/login");
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      const rid = String(session.user_id);

      if (!token) {
        Alert.alert("Fel", "Ingen QR-token hittades");
        return router.back();
      }

      await fetchQrData(rid, sessionId, token);
    };

    init();
  }, [token]);

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
      let data = JSON.parse(text);

      if (!Array.isArray(data.addresses) || data.addresses.length === 0) {
        Alert.alert("Ogiltig QR-kod");
        return;
      }

      setFormData(data);
      setCheckStatus(Number(data.Checkstatus ?? 0));
      setChid(Number(data.CHID ?? 0));
      setCurrentAddress(data.addresses[0]?.Address ?? "");
    } catch {
      Alert.alert("Fel", "Misslyckades");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    const session = await checkSession();
    if (!session?.user_id) return Alert.alert("Session saknas");

    if (!selectedAddress) return Alert.alert("Välj adress");

    const isCheckInState =
      checkStatus === 3 || checkStatus === null || checkStatus === 0;

    if (isCheckInState && !selectedService) return Alert.alert("Välj tjänst");

    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    const rid = String(session.user_id);

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

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await res.text();
    const json = JSON.parse(text.trim());

    if (json.success) {
      if (checkStatus === 1) {
        await SecureStore.deleteItemAsync("checkedAddress");
      } else {
        await SecureStore.setItemAsync("checkedAddress", currentAddress);
      }

      router.replace("/(tabs)");
      return;
    }

    Alert.alert("Fel", json.message ?? "Misslyckades");
  };

  if (loading)
    return (
      <ActivityIndicator
        style={{ marginTop: 60 }}
        size="large"
        color={theme.COLORS.primary}
      />
    );

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.COLORS.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.COLORS.text }]}>
        📋 QR Detaljer
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.COLORS.text }]}>
        Välj Adress
      </Text>

      <View
        style={[
          styles.pickerBox,
          { backgroundColor: theme.COLORS.card, borderColor: theme.COLORS.border },
        ]}
      >
        <Picker selectedValue={selectedAddress} onValueChange={setSelectedAddress}>
          <Picker.Item label="Välj adress..." value="" />
          {formData.addresses?.map((a: any, i: number) => (
            <Picker.Item key={i} label={a.Address} value={a.PRID} />
          ))}
        </Picker>
      </View>

      {isCheckInState && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.COLORS.text }]}>
            Välj Tjänst
          </Text>

          <View
            style={[
              styles.pickerBox,
              { backgroundColor: theme.COLORS.card, borderColor: theme.COLORS.border },
            ]}
          >
            <Picker selectedValue={selectedService} onValueChange={setSelectedService}>
              <Picker.Item label="Välj tjänst..." value="" />
              {formData.services?.map((s: any, i: number) => (
                <Picker.Item key={i} label={s.Service} value={s.RSPID} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <TouchableOpacity style={theme.BUTTON.primary} onPress={handleCheck}>
        <Text style={theme.BUTTON.primaryText}>
          {checkStatus === 1 ? "Checka ut" : "Checka in"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: 10 },
  pickerBox: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
});
