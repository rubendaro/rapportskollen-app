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
import { useTheme } from "../constants/theme";
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
  const theme = useTheme();

  const [hours, setHours] = useState<HourRecord[]>([]);
  const [totalHours, setTotalHours] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [dateS, setDateS] = useState("");
  const [dateE, setDateE] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchHours = async () => {
    if (!dateS || !dateE) {
      Alert.alert("Välj datum", "Ange start och slutdatum");
      return;
    }

    setLoading(true);

    try {
      const session = await checkSession();
      if (!session?.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        setLoading(false);
        return;
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      if (!sessionId) {
        Alert.alert("Session saknas", "Logga in igen");
        setLoading(false);
        return;
      }

      const rid = String(session.user_id);

      const body =
        `session_id=${sessionId}` +
        `&rid=${rid}` +
        `&dateS=${dateS}` +
        `&dateE=${dateE}` +
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
      let data: any[] = JSON.parse(text);

      const total = data.find((r: any) => r.totalHours)?.totalHours ?? "0.00";
      setTotalHours(total);

      const valid = data.filter((x) => x.success === true);
      setHours(valid);
    } catch (err) {
      Alert.alert("Fel", "Kunde inte hämta historiska timmar.");
    }

    setLoading(false);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: HourRecord }) => (
    <View
      style={[
        styles.row,
        { borderColor: theme.COLORS.border },
      ]}
    >
      <Text style={[styles.cell, { color: theme.COLORS.text }]}>{item.OID}</Text>
      <Text style={[styles.cell, { color: theme.COLORS.text }]}>{item.Datum}</Text>
      <Text style={[styles.cell, { color: theme.COLORS.text }]}>{item.Adress}</Text>
      <Text style={[styles.cell, { color: theme.COLORS.text }]}>{item.Tjänst}</Text>
      <Text
        style={[
          styles.cell,
          { color: theme.COLORS.text },
          styles.bold,
        ]}
      >
        {item.Timmar}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.COLORS.background },
      ]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: theme.COLORS.primary },
        ]}
      >
        <MaterialIcons name="history" size={26} color={theme.COLORS.white} />
        <Text style={[styles.headerTitle, { color: theme.COLORS.white }]}>
          Historiska timmar
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.dateButton,
          { borderColor: theme.COLORS.primary },
        ]}
        onPress={() => setShowStartPicker(true)}
      >
        <Text style={{ color: theme.COLORS.text, fontWeight: "600" }}>
          Startdatum: {dateS || "Välj..."}
        </Text>
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

      <TouchableOpacity
        style={[
          styles.dateButton,
          { borderColor: theme.COLORS.primary },
        ]}
        onPress={() => setShowEndPicker(true)}
      >
        <Text style={{ color: theme.COLORS.text, fontWeight: "600" }}>
          Slutdatum: {dateE || "Välj..."}
        </Text>
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

      <TouchableOpacity
        style={[
          styles.fetchButton,
          { backgroundColor: theme.COLORS.primary },
        ]}
        onPress={fetchHours}
      >
        <Text style={{ color: theme.COLORS.white, fontWeight: "700" }}>
          Visa timmar
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color={theme.COLORS.primary}
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
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: theme.COLORS.textSecondary }}>
                Inga historiska timmar
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 70 }}
        />
      )}

      <View
        style={[
          styles.footer,
          {
            borderColor: theme.COLORS.primary,
            backgroundColor: theme.COLORS.card,
          },
        ]}
      >
        <Text style={{ fontWeight: "700", color: theme.COLORS.primary }}>
          Totalt:
        </Text>
        <Text style={{ fontWeight: "900", fontSize: 18, color: theme.COLORS.primary }}>
          {totalHours}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  header: {
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },

  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  fetchButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 6,
  },

  cell: { fontSize: 12 },
  bold: { fontWeight: "700" },

  footer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    padding: 12,
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
