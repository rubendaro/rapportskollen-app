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
import { useTheme } from "../constants/theme";
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
  const { COLORS, SPACING } = useTheme();

  const [hours, setHours] = useState<HourRecord[]>([]);
  const [totalHours, setTotalHours] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHours = async () => {
    try {
      setLoading(true);

      const session = await checkSession();
      if (!session || !session.user_id) {
        Alert.alert("Session saknas", "Logga in igen");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const sessionId = await SecureStore.getItemAsync("phpSessionId");
      if (!sessionId) return;

      const rid = String(session.user_id);
      const paid = session.manual ?? 0;

      const body =
        `session_id=${encodeURIComponent(sessionId)}` +
        `&rid=${encodeURIComponent(rid)}` +
        `&paid=${encodeURIComponent(paid)}` +
        `&is_paid=0`;

      const res = await fetch(
        "https://rapportskollen.com/mobile/display_hours.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        }
      );

      const txt = await res.text();

      let data: any = [];
      try {
        data = JSON.parse(txt);
      } catch {}

      const total = data.find((r: any) => r.totalHours)?.totalHours ?? "0.00";
      setTotalHours(total);

      const validRows = data.filter((r: any) => r.success);
      setHours(validRows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHours();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHours();
  }, []);

  const renderItem = ({ item }: { item: HourRecord }) => (
    <View style={styles(COLORS, SPACING).row}>
      <Text style={[styles(COLORS, SPACING).cell, styles(COLORS, SPACING).colProject]}>{item.OID}</Text>
      <Text style={[styles(COLORS, SPACING).cell, styles(COLORS, SPACING).colDate]}>{item.Datum}</Text>
      <Text style={[styles(COLORS, SPACING).cell, styles(COLORS, SPACING).colAddress]}>{item.Adress}</Text>
      <Text style={[styles(COLORS, SPACING).cell, styles(COLORS, SPACING).colService]}>{item.Tjänst}</Text>
      <Text style={[styles(COLORS, SPACING).cell, styles(COLORS, SPACING).colHours, styles(COLORS, SPACING).bold]}>
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
    <View style={styles(COLORS, SPACING).container}>
      <View style={styles(COLORS, SPACING).header}>
        <MaterialIcons name="schedule" size={28} color="#fff" />
        <Text style={styles(COLORS, SPACING).headerTitle}>Tidsrapport</Text>
      </View>

      <FlatList
        data={hours}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <View style={styles(COLORS, SPACING).footer}>
        <Text style={styles(COLORS, SPACING).footerText}>Totalt:</Text>
        <Text style={styles(COLORS, SPACING).footerHours}>{totalHours}</Text>
      </View>
    </View>
  );
}

const styles = (COLORS:any, SPACING:any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: SPACING.m,
    },

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

    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: COLORS.border,
      paddingVertical: 6,
    },
    cell: { fontSize: 12, color: COLORS.secondary },
    bold: { fontWeight: "700" },

    footer: {
      backgroundColor: COLORS.card,
      borderRadius: 8,
      padding: SPACING.m,
      borderWidth: 1,
      borderColor: COLORS.primary,
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
    },
    footerText: { color: COLORS.primary, fontWeight: "700" },
    footerHours: { color: COLORS.primary, fontSize: 18, fontWeight: "800" },

    colProject: { flex: 1 },
    colDate: { flex: 1.3 },
    colAddress: { flex: 2 },
    colService: { flex: 1.2 },
    colHours: { flex: 0.8, textAlign: "right" },
  });
