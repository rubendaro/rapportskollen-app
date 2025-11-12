import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

interface HourRecord {
  OID: string;
  Datum: string;
  Adress: string;
  Tjänst: string;
  Timmar: string;
  success?: boolean;
}

export default function OldHoursScreen() {
  const [hours, setHours] = useState<HourRecord[]>([]);
  const [totalHours, setTotalHours] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [dateS, setDateS] = useState("");
  const [dateE, setDateE] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ✅ Fetch old hours safely
  const fetchHours = async () => {
    if (!dateS || !dateE) {
      Alert.alert("Välj datum", "Ange start och slutdatum");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. Validate session
      const session = await checkSession();
      if (!session || !session.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      if (!sessionId) {
        Alert.alert("Session saknas", "Logga in igen");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const rid = String(session.user_id);

      // ✅ 2. Send request
      const body =
        `session_id=${encodeURIComponent(sessionId)}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&dateS=${encodeURIComponent(dateS)}` +
        `&dateE=${encodeURIComponent(dateE)}` +
        `&is_paid=1`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/display_hours.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );

      const text = await res.text();
      console.log("📦 Paid hours response:", text);

      let data: any[] = [];
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.log("❗ JSON parse error:", text);
        Alert.alert("Fel", "Kunde inte läsa svar från servern");
        return;
      }

      if (!Array.isArray(data)) {
        console.log("❗ Unexpected format:", data);
        Alert.alert("Fel", "Felaktigt svar från servern");
        return;
      }

      // ✅ Extract totals & safe rows
      const total = data.find((r: any) => r.totalHours)?.totalHours ?? "0.00";
      setTotalHours(total);

      const validRows = data.filter((r: any) => r.success);
      setHours(validRows);

      if (validRows.length === 0) {
        console.log("ℹ️ No historical hours (only totalHours present)");
        // No alert or navigation, just show empty list
      }
    } catch (err) {
      console.log("❌ Fetch old hours error:", err);
      Alert.alert("Fel", "Kunde inte hämta historiska timmar.");
    }

    setLoading(false);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: HourRecord }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.colProject]}>{item.OID}</Text>
      <Text style={[styles.cell, styles.colDate]}>{item.Datum}</Text>
      <Text style={[styles.cell, styles.colAddress]}>{item.Adress}</Text>
      <Text style={[styles.cell, styles.colService]}>{item.Tjänst}</Text>
      <Text style={[styles.cell, styles.colHours, styles.bold]}>
        {item.Timmar}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="history" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Historiska timmar</Text>
      </View>

      {/* ✅ Start Date Picker */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Text style={styles.dateText}>Startdatum: {dateS || "Välj..."}</Text>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(e, d) => {
            setShowStartPicker(false);
            if (d) setDateS(d.toISOString().split("T")[0]);
          }}
        />
      )}

      {/* ✅ End Date Picker */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Text style={styles.dateText}>Slutdatum: {dateE || "Välj..."}</Text>
      </TouchableOpacity>

      {showEndPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(e, d) => {
            setShowEndPicker(false);
            if (d) setDateE(d.toISOString().split("T")[0]);
          }}
        />
      )}

      {/* ✅ Fetch Button */}
      <TouchableOpacity style={styles.fetchButton} onPress={fetchHours}>
        <Text style={styles.fetchButtonText}>Visa timmar</Text>
      </TouchableOpacity>

      {/* ✅ Results */}
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <FlatList
          data={hours}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchHours} />
          }
          ListEmptyComponent={
            !loading && (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Text style={{ color: COLORS.secondary }}>
                  Inga historiska timmar hittades
                </Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* ✅ Footer Total */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Totalt:</Text>
        <Text style={styles.footerHours}>{totalHours}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.m },

  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  dateButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dateText: { fontWeight: "600", color: COLORS.secondary },

  fetchButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 10,
  },
  fetchButtonText: { color: "white", fontWeight: "700" },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 6,
  },
  cell: { fontSize: 12, color: COLORS.secondary },

  colProject: { flex: 0.6 },
  colDate: { flex: 1.2 },
  colAddress: { flex: 2.2, paddingLeft: 8 },
  colService: { flex: 1.2 },
  colHours: { flex: 0.8, textAlign: "right" },
  bold: { fontWeight: "700" },

  footer: {
    backgroundColor: "#E8F4D8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },
  footerText: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  footerHours: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
});
