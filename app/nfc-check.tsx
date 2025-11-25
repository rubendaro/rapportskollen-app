import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";
import { useTheme } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

export default function NfcCheck() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedAddressLabel, setSelectedAddressLabel] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rid, setRid] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const session = await checkSession();

      if (!session?.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        router.replace("/login");
        return;
      }

      setRid(String(session.user_id));
      const sid = await SecureStore.getItemAsync("phpSessionId");
      setSessionId(sid);
    };

    init();
    NfcManager.start();
  }, []);

  const decodeNdefPayload = (record: any): string => {
    try {
      if (record.tnf === Ndef.TNF_WELL_KNOWN) {
        if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
          return Ndef.text.decodePayload(record.payload).trim();
        }
      }
      return new TextDecoder().decode(record.payload).trim();
    } catch {
      return "";
    }
  };

  const readNfc = async () => {
    try {
      setLoading(true);
      setSelectedAddress("");
      setSelectedService("");
      setFormData(null);

      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      let decoded = "";
      for (const rec of tag?.ndefMessage ?? [])
        decoded += decodeNdefPayload(rec);

      const clean = decoded.trim().replace(/\s+/g, "");

      if (!clean) {
        Alert.alert("Ingen token hittades");
        return;
      }

      const body =
        `session_id=${encodeURIComponent(sessionId ?? "")}` +
        `&rid=${encodeURIComponent(rid ?? "")}` +
        `&token=${encodeURIComponent(clean)}`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/check_add_tag.php",
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
      );

      const json = JSON.parse(await res.text());

      if (!json.addresses?.length) {
        Alert.alert("Ingen adress hittades");
        return;
      }

      setFormData(json);
      setCheckStatus(Number(json.Checkstatus ?? 0));
      setChid(Number(json.CHID ?? 0));

    } catch {
      Alert.alert("Fel vid NFC");
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!selectedAddress) return Alert.alert("Välj projekt");

    const isCheckIn = checkStatus === 3 || checkStatus === null || checkStatus === 0;

    if (isCheckIn && !selectedService) return Alert.alert("Välj service");

    const form = new URLSearchParams();
    form.append("session_id", sessionId ?? "");
    form.append("rid", rid ?? "");
    form.append("PRID", selectedAddress);
    if (isCheckIn) form.append("RSPID", selectedService);
    if (chid !== null) form.append("CHID", String(chid));

    const url =
      checkStatus === 1
        ? "https://rapportskollen.com/mobile/checkout.php"
        : "https://rapportskollen.com/mobile/checkin.php";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const json = JSON.parse(await res.text());

    if (!json.success) return Alert.alert("Fel", json.message);

    router.replace("/(tabs)");
  };

  const isCheckIn = checkStatus === 1 ? false : true;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, {
        backgroundColor: theme.COLORS.background
      }]}
    >
      <Text style={[styles.title, { color: theme.COLORS.text }]}>
        NFC Check-in / Check-out
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.COLORS.primary }]}
        onPress={readNfc}
      >
        {loading ? (
          <ActivityIndicator color={theme.COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Skanna NFC</Text>
        )}
      </TouchableOpacity>

      {formData && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.COLORS.text }]}>
            Välj adress
          </Text>

          <Picker
            selectedValue={selectedAddress}
            onValueChange={setSelectedAddress}
            style={[styles.picker, { backgroundColor: theme.COLORS.card }]}
          >
            <Picker.Item label="Välj adress..." value="" />
            {formData.addresses.map((a:any) => (
              <Picker.Item key={a.PRID} label={a.Address} value={a.PRID} />
            ))}
          </Picker>

          {isCheckIn && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.COLORS.text }]}>
                Välj tjänst
              </Text>

              <Picker
                selectedValue={selectedService}
                onValueChange={setSelectedService}
                style={[styles.picker, { backgroundColor: theme.COLORS.card }]}
              >
                <Picker.Item label="Välj tjänst..." value="" />
                {formData.services.map((s:any) => (
                  <Picker.Item key={s.RSPID} label={s.Service} value={s.RSPID} />
                ))}
              </Picker>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.COLORS.primary }]}
            onPress={handleCheck}
          >
            <Text style={styles.buttonText}>
              {checkStatus === 1 ? "Checka ut" : "Checka in"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 25, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sectionTitle: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  picker: { borderRadius: 8 },
});
