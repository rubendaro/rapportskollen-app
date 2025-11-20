import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import { checkSession } from "../utils/checkSession";

interface HourRecord {
  success?: boolean;
  OID: string;
  ProjektNr: string;
  Datum: string;
  Adress: string;
  Tjänst: string;
  Timmar: string;
}

export default function TimeReportScreen() {
  const [hours, setHours] = useState<HourRecord[]>([]);
  const [totalHours, setTotalHours] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ NEW — fetchHours using $_POST["session_id"]
  const fetchHours = async () => {
    try {
      setLoading(true);

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

      // ✅ Use updated values returned from session_check
      const rid = String(session.user_id);
      const paid = session.manual ?? 0;

      // ✅ 2. Backend call using $_POST — URL encoded
      const body =
        `session_id=${encodeURIComponent(sessionId)}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&paid=${encodeURIComponent(paid)}` +
        `&is_paid=0`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/display_hours.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const text = await res.text();
      console.log(" display_hours.php →", text);

      let data: any = [];
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("❗ JSON parse error:", text);
        Alert.alert("Fel", "Kunde inte läsa svar från servern");
        return;
      }

      if (!Array.isArray(data)) {
        console.log("❗ Unexpected format:", data);
        Alert.alert("Fel", "Felaktigt svar från servern");
        return;
      }

      // ✅ Extract totals & rows
      const total = data.find((r: any) => r.totalHours)?.totalHours ?? "0.00";
      setTotalHours(total);

      setHours(data.filter((r: any) => r.success));
    } catch (e) {
      console.log("❌ Fetch hours error:", e);
      Alert.alert("Fel", "Kunde inte hämta timmar");
    }

    setLoading(false);
    setRefreshing(false);
  };

  // ✅ Load on mount
  useEffect(() => {
    fetchHours();
  }, []);

  // ✅ Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHours();
  }, []);

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

  if (loading) {
    return (
      <ActivityIndicator
        style={{ marginTop: 60 }}
        size="large"
        color={COLORS.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="schedule" size={28} color="#fff" />
        <Text style={styles.headerTitle}>Tidsrapport</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.colProject]}>Projekt</Text>
        <Text style={[styles.headerCell, styles.colDate]}>Datum</Text>
        <Text style={[styles.headerCell, styles.colAddress]}>Adress</Text>
        <Text style={[styles.headerCell, styles.colService]}>Tjänst</Text>
        <Text style={[styles.headerCell, styles.colHours]}>Tim</Text>
      </View>

      <FlatList
        data={hours}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

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

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
    paddingBottom: 4,
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    fontWeight: "700",
    fontSize: 12,
    color: COLORS.primary,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  cell: { flex: 1, fontSize: 12, color: COLORS.secondary },
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

  colProject: { flex: 0.6 },
  colDate: { flex: 1.2 },
  colAddress: { flex: 2.2, paddingLeft: 8 },
  colService: { flex: 1.2 },
  colHours: { flex: 0.8, textAlign: "right" },
});
