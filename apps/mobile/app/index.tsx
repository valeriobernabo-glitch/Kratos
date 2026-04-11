import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kratos WMS</Text>
        <Text style={styles.subtitle}>Warehouse Scanner</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/receive")}
        >
          <Text style={styles.cardIcon}>📦</Text>
          <Text style={styles.cardTitle}>Receive Stock</Text>
          <Text style={styles.cardDesc}>Scan & receive against PO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardDisabled]}
          disabled
        >
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Pick Orders</Text>
          <Text style={styles.cardDesc}>Coming in Phase 4</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardDisabled]}
          disabled
        >
          <Text style={styles.cardIcon}>📦</Text>
          <Text style={styles.cardTitle}>Pack Orders</Text>
          <Text style={styles.cardDesc}>Coming in Phase 4</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/scan")}
        >
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>Quick Scan</Text>
          <Text style={styles.cardDesc}>Look up product or location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    padding: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  subtitle: {
    fontSize: 14,
    color: "#4a4a68",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cardDisabled: {
    opacity: 0.4,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e2d",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: "#4a4a68",
  },
});
