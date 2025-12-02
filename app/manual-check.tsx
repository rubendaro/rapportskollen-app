import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { checkSession } from "../utils/checkSession";

type AddressOption = { PRID: string; Address: string };
type ServiceOption = { RSPID: string; Service: string };

export default function ManualCheckScreen() {
  const router = useRouter();

  const [addressInput, setAddressInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [checkStatus, setCheckStatus] = useState<number | null>(null);
  const [chid, setChid] = useState<number | null>(null);
  const [addressWarning, setAddressWarning] = useState<string | null>(null);

  const fetchProjectsManually = async () => {
    if (!addressInput.trim()) {
      Alert.alert("Fel", "Ange en adress.");
      return;
    }

    const session = await checkSession();
    if (!session?.user_id) {
      Alert.alert("Session saknas", "Logga in igen.");
      return router.replace("/login");
    }

    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    const rid = String(session.user_id);
    const paid = session.manual ?? 0;

    setLoading(true);

    try {
      const body =
        `session_id=${encodeURIComponent(sessionId ?? "")}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&paid=${encodeURIComponent(paid)}` +
        `&address=${encodeURIComponent(addressInput)}`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/display_project_and_services.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );

      const txt = await res.text();
      console.log("Manual →", txt);

      let data: any = {};
      try { data = JSON.parse(txt); } catch {}

      const addr = data.addresses || [];
      setAddresses(addr);
      setServices(data.services || []);

      addr.length === 0
        ? setAddressWarning("⚠️ Ingen adress hittades")
        : setAddressWarning(null);

      setCheckStatus(
        data.Checkstatus !== undefined ? Number(data.Checkstatus) : null
      );

      setChid(
        data.CHID !== undefined &&
        data.CHID !== null &&
        data.CHID !== ""
          ? Number(data.CHID)
          : null
      );

    } catch (err) {
      Alert.alert("Fel", "Kunde inte hämta data.");
    }

    setLoading(false);
  };

  const isCheckInState =
    checkStatus === 3 || checkStatus === null || checkStatus === 0;

  const handleCheckIn = async () => {
    if (!selectedAddress) {
      Alert.alert("Välj projekt");
      return;
    }

    if (isCheckInState && !selectedService) {
      Alert.alert("Välj service");
      return;
    }

    const session = await checkSession();
    if (!session?.user_id) {
      Alert.alert("Session saknas");
      return router.replace("/login");
    }

    const sessionId = await SecureStore.getItemAsync("phpSessionId");
    const rid = String(session.user_id);

    try {
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
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });

      const text = await res.text();
      const json = JSON.parse(text);

      if (json.success) {
        // ⭐ SAVE address on check-in
        if (checkStatus !== 1) {
          const name =
            addresses.find(a => a.PRID == selectedAddress)?.Address || "";
          if (name) await SecureStore.setItemAsync("checkedAddress", name);
        }

        // ⭐ CLEAR address on check-out
        if (checkStatus === 1) {
          await SecureStore.deleteItemAsync("checkedAddress");
        }

        Alert.alert("Klar", json.message);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Fel", json.message);
      }

    } catch {
      Alert.alert("Fel", "Ett fel uppstod");
    }
  };

  const buttonText = checkStatus === 1 ? "Checka ut" : "Checka in";

  const buttonDisabled =
    addresses.length === 0 ||
    (isCheckInState ? !selectedAddress || !selectedService : !selectedAddress);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.header}>Manuell incheckning</Text>

        <Text style={styles.label}>Adress:</Text>
        <TextInput
          style={styles.input}
          placeholder="T.ex. Gatunamn"
          value={addressInput}
          onChangeText={setAddressInput}
        />

        <TouchableOpacity
          style={[styles.fetchButton, loading && { opacity: 0.6 }]}
          onPress={fetchProjectsManually}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sök adress</Text>}
        </TouchableOpacity>

        {addressWarning && <Text style={styles.warningText}>{addressWarning}</Text>}

        <Text style={styles.label}>Projekt:</Text>
        <Picker
          selectedValue={selectedAddress}
          onValueChange={(val) => setSelectedAddress(String(val))}
          style={styles.picker}
          enabled={addresses.length > 0}
        >
          <Picker.Item label="-- Välj --" value="" />
          {addresses.map((a, i) => (
            <Picker.Item key={i} label={a.Address} value={a.PRID} />
          ))}
        </Picker>

        {isCheckInState && addresses.length > 0 && (
          <>
            <Text style={styles.label}>Service:</Text>
            <Picker
              selectedValue={selectedService}
              onValueChange={(val) => setSelectedService(String(val))}
              style={styles.picker}
            >
              <Picker.Item label="-- Välj --" value="" />
              {services.map((s, i) => (
                <Picker.Item key={i} label={s.Service} value={s.RSPID} />
              ))}
            </Picker>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, buttonDisabled && { backgroundColor: "#999" }]}
          onPress={handleCheckIn}
          disabled={buttonDisabled}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding:20, paddingBottom:80 },
  header: { fontSize:22, fontWeight:"700", marginBottom:15, color:"green" },
  label: { fontWeight:"600", marginTop:10 },
  input:{ borderColor:"#ccc", borderWidth:1, padding:10, borderRadius:8, marginTop:5 },
  fetchButton:{ backgroundColor:"green", padding:15, borderRadius:8, alignItems:"center", marginTop:10 },
  picker:{ marginVertical:10, backgroundColor:"#f5f5f5" },
  button:{ backgroundColor:"green", padding:15, borderRadius:8, alignItems:"center", marginTop:20 },
  buttonText:{ color:"#fff", fontWeight:"700" },
  warningText:{ color:"red", marginTop:10, fontWeight:"600" }
});
