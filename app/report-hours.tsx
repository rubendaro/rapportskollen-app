import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
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
import { COLORS } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

interface AddressOption {
  PRID: string;
  Address: string;
}

interface ServiceOption {
  RSPID: string;
  Service: string;
}

export default function ReportHoursScreen() {
  const router = useRouter();

  const [addressInput, setAddressInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const [date, setDate] = useState("");
  const [hours, setHours] = useState("08:00");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const selectedWorkType = "1";

  const searchAddress = async () => {
    if (!addressInput.trim()) {
      return Alert.alert("Fel", "Ange adress för att söka");
    }

    setLoading(true);

    try {
      const session = await checkSession();
      if (!session || !session.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        return router.replace("/login");
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      const rid = String(session.user_id);

      const body =
        `session_id=${encodeURIComponent(sessionId ?? "")}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&address=${encodeURIComponent(addressInput)}`;

      const res = await fetch("https://rapportskollen.com/mobile/report.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const txt = await res.text();
      console.log("✅ report.php →", txt);

      let data: any = {};
      try {
        data = JSON.parse(txt);
      } catch {
        return Alert.alert("Fel", "Ogiltigt svar från servern");
      }

      setAddresses(data.addresses || []);
      setServices(data.services || []);

      if (!data.addresses?.length) {
        Alert.alert("Ingen träff", "Inga projekt hittades.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Fel", "Kunde inte hämta data");
    } finally {
      setLoading(false);
    }
  };

  const submitHours = async () => {
    if (!selectedAddress) return Alert.alert("Välj adress");
    if (!selectedService) return Alert.alert("Välj tjänst");
    if (!date.trim()) return Alert.alert("Ange datum");
    if (!hours.trim()) return Alert.alert("Ange timmar");

    try {
      const session = await checkSession();
      if (!session || !session.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        return router.replace("/login");
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      const rid = String(session.user_id);

      const body = new URLSearchParams();
      body.append("session_id", sessionId ?? "");
      body.append("rid", rid);
      body.append("PRID", selectedAddress);
      body.append("RSPID", selectedService);
      body.append("WTID", selectedWorkType);
      body.append("SDate", date);
      body.append("Hours", hours);

      const res = await fetch(
        "https://rapportskollen.com/mobile/report_do.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );

      const txt = await res.text();
      console.log("✅ report_do.php →", txt);

      let json: any = null;
      try {
        json = JSON.parse(txt.trim());
      } catch {
        console.log("JSON parse issue", txt);
      }

      if (json?.success) {
        Alert.alert("✅ Klart", json.message || "Rapporteringen lyckades");

        setAddressInput("");
        setSelectedAddress("");
        setSelectedService("");
        setDate("");
        setHours("08:00");

        router.replace("/(tabs)");
        return;
      }

      Alert.alert("Fel", json?.message || "Misslyckades att skicka");
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Fel",
        "Ett fel uppstod, men kontrollera ifall timmarna sparades."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Rapportera arbetstid</Text>

        <TextInput
          style={styles.input}
          placeholder="Sök adress..."
          value={addressInput}
          onChangeText={setAddressInput}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={searchAddress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sök</Text>
          )}
        </TouchableOpacity>

        {addresses.length > 0 && (
          <>
            <Text style={styles.label}>Adress</Text>
            <Picker
              selectedValue={selectedAddress}
              onValueChange={setSelectedAddress}
              style={styles.picker}
            >
              <Picker.Item label="Välj adress..." value="" />
              {addresses.map((a, i) => (
                <Picker.Item key={i} label={a.Address} value={a.PRID} />
              ))}
            </Picker>

            <Text style={styles.label}>Tjänst</Text>
            <Picker
              selectedValue={selectedService}
              onValueChange={setSelectedService}
              style={styles.picker}
            >
              <Picker.Item label="Välj tjänst..." value="" />
              {services.map((s, i) => (
                <Picker.Item key={i} label={s.Service} value={s.RSPID} />
              ))}
            </Picker>

            <Text style={styles.label}>Datum</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date || "Välj datum"}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                onChange={(event: any, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    setDate(selected.toISOString().split("T")[0]);
                  }
                }}
              />
            )}

            <Text style={styles.label}>Timmar</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>{hours || "Välj tid (ex: 08:00)"}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const d = new Date();
                  d.setHours(8);
                  d.setMinutes(0);
                  return d;
                })()}
                mode="time"
                is24Hour={true}
                onChange={(event: any, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    const h = selected.getHours().toString().padStart(2, "0");
                    const m = selected.getMinutes().toString().padStart(2, "0");
                    setHours(`${h}:${m}`);
                  }
                }}
              />
            )}

            <TouchableOpacity style={styles.button} onPress={submitHours}>
              <Text style={styles.buttonText}>Skicka timmar</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  picker: {
    marginVertical: 10,
    backgroundColor: "#f5f5f5",
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
  },
  button: {
    backgroundColor: COLORS.success,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
