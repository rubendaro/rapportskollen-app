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
  TouchableOpacity,
  View,
} from "react-native";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";
import { COLORS } from "../constants/theme";
import { checkSession } from "../utils/checkSession"; // ✅ ADDED

export default function NfcCheck() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedAddressLabel, setSelectedAddressLabel] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);

  // ✅ session values
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rid, setRid] = useState<string | null>(null);

  useEffect(() => {

    
    const init = async () => {
      const session = await checkSession();

      if (!session || !session.user_id) {
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
        if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
          return Ndef.uri.decodePayload(record.payload).trim();
        }
      }
      const decoder = new TextDecoder();
      return decoder.decode(record.payload).trim();
    } catch {
      return "";
    }
  };

  const readNfc = async () => {
    if (!rid || !sessionId) {
      Alert.alert("Fel", "Session saknas. Logga in igen.");
      return;
    }

    try {
      setLoading(true);
      setFormData(null);
      setToken(null);
      setSelectedAddress("");
      setSelectedAddressLabel("");
      setSelectedService("");
      setCheckStatus(null);
      setChid(null);

      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (!tag?.ndefMessage?.length) {
        Alert.alert("Ingen NDEF-data hittades på taggen.");
        return;
      }

      let decodedText = "";
      for (const record of tag.ndefMessage)
        decodedText += decodeNdefPayload(record);

      const cleanToken = decodedText.trim().replace(/\s+/g, "");

      if (!cleanToken) {
        Alert.alert("Taggen verkar tom", "Ingen token hittades.");
        return;
      }

      setToken(cleanToken);

      // ✅ Session included
      const body =
        `rid=${encodeURIComponent(rid)}` +
        `&session_id=${encodeURIComponent(sessionId ?? "")}` +
        `&token=${encodeURIComponent(cleanToken)}`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/check_add_tag.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const text = await res.text();
      let data = JSON.parse(text);

      if (Array.isArray(data.addresses) && data.addresses.length > 0) {
        setFormData(data);
        setCheckStatus(Number(data.Checkstatus ?? 0));
        setChid(Number(data.CHID ?? 0));
      } else {
        Alert.alert("Ingen adress hittades.");
      }
    } catch (err) {
      Alert.alert("Fel vid NFC-läsning");
    } finally {
      setLoading(false);
      NfcManager.cancelTechnologyRequest();
    }
  };

  const handleCheck = async () => {
    if (!selectedAddress) {
      Alert.alert("Välj projekt", "Du måste välja en adress.");
      return;
    }

    const isCheckInState =
      checkStatus === 3 || checkStatus === null || checkStatus === 0;

    if (isCheckInState && !selectedService) {
      Alert.alert("Välj tjänst", "Du måste välja en tjänst.");
      return;
    }

    const session = await checkSession();
    if (!session || !session.user_id) {
      Alert.alert("Session saknas", "Logga in igen.");
      router.replace("/login");
      return;
    }

    const rid = String(session.user_id);
    const sessionId = await SecureStore.getItemAsync("phpSessionId");

    const formData = new URLSearchParams();
    formData.append("rid", rid);
    formData.append("PRID", selectedAddress);
    formData.append("session_id", sessionId ?? "");
    if (isCheckInState) formData.append("RSPID", selectedService);
    if (chid !== null) formData.append("CHID", String(chid));

    let url =
      checkStatus === 1
        ? "https://rapportskollen.com/mobile/checkout.php"
        : "https://rapportskollen.com/mobile/checkin.php";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text.trim());
    } catch {
      Alert.alert("Fel", "Ogiltigt svar från server.");
      return;
    }

    if (json.success) {
      if (checkStatus === 1) {
        await SecureStore.deleteItemAsync("checkedAddress");
      } else {
        await SecureStore.setItemAsync("checkedAddress", selectedAddressLabel);
      }

      router.replace("/(tabs)");
      return;
    }

    Alert.alert("Fel", json.message || "Misslyckades att skicka.");
  };

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  const buttonText = checkStatus === 1 ? "Checka ut" : "Checka in";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NFC Check-in / Check-out</Text>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={readNfc}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Skanna NFC</Text>
        )}
      </TouchableOpacity>

      {formData && (
        <View style={styles.form}>
          <View
            style={[
              styles.statusBox,
              { backgroundColor: isCheckInState ? COLORS.primary : COLORS.success },
            ]}
          >
            <Text style={styles.statusText}>
              {checkStatus === 1 ? "✅ Incheckad" : "🔵 Ej incheckad"}
            </Text>
            {chid && <Text style={styles.statusSub}>CHID: {chid}</Text>}
          </View>

          <Text style={styles.sectionTitle}>Välj Adress</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedAddress}
              onValueChange={(v, idx) => {
                setSelectedAddress(v);
                const label =
                  idx > 0 && formData.addresses[idx - 1]
                    ? formData.addresses[idx - 1].Address
                    : "";
                setSelectedAddressLabel(label);
              }}
            >
              <Picker.Item label="Välj adress..." value="" />
              {formData.addresses.map((item: any, idx: number) => (
                <Picker.Item
                  key={idx}
                  label={`${item.Address} ** ${item.PRID}`}
                  value={item.PRID}
                />
              ))}
            </Picker>
          </View>

          {isCheckInState && (
            <>
              <Text style={styles.sectionTitle}>Välj Tjänst</Text>
              <View style={styles.pickerBox}>
                <Picker
                  selectedValue={selectedService}
                  onValueChange={(v) => setSelectedService(v)}
                >
                  <Picker.Item label="Välj tjänst..." value="" />
                  {formData.services?.map((s: any, idx: number) => (
                    <Picker.Item key={idx} label={s.Service} value={s.RSPID} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isCheckInState ? COLORS.primary : COLORS.success },
            ]}
            onPress={handleCheck}
          >
            <Text style={styles.submitText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  form: { marginTop: 30, width: "100%" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 15,
  },
  pickerBox: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  statusText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statusSub: { color: "#fff", fontSize: 14, marginTop: 5 },
  submitButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
