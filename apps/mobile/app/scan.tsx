import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { api } from "../lib/api";
import { BarcodeScanner } from "../components/BarcodeScanner";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  weightKg: number | null;
  active: boolean;
};

type Location = {
  id: string;
  name: string;
  barcode: string;
  row: string | null;
  bay: number | null;
  level: number | null;
  bin: number | null;
  locationType: string;
};

export default function ScanScreen() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<{
    type: "product" | "location" | "not_found";
    product?: Product;
    location?: Location;
    barcode?: string;
  } | null>(null);

  async function handleScan(barcode: string) {
    setScanning(false);

    // Try product first
    try {
      const products = await api<{ data: Product[] }>(
        `/api/products?search=${barcode}&pageSize=1`,
      );
      if (products.data.length > 0) {
        setResult({ type: "product", product: products.data[0], barcode });
        return;
      }
    } catch {}

    // Try location
    try {
      const locations = await api<{ data: Location[] }>(
        `/api/locations?search=${barcode}&pageSize=1`,
      );
      if (locations.data.length > 0) {
        setResult({ type: "location", location: locations.data[0], barcode });
        return;
      }
    } catch {}

    setResult({ type: "not_found", barcode });
  }

  if (scanning) {
    return (
      <BarcodeScanner
        instruction="Scan any barcode to look up"
        onScan={handleScan}
        onClose={() => router.back()}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {result?.type === "product" && result.product && (
        <View style={styles.resultCard}>
          <Text style={styles.resultType}>PRODUCT</Text>
          <Text style={styles.resultName}>{result.product.name}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SKU</Text>
            <Text style={styles.detailValue}>{result.product.sku}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Barcode</Text>
            <Text style={styles.detailValue}>{result.product.barcode ?? "—"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Weight</Text>
            <Text style={styles.detailValue}>
              {result.product.weightKg ? `${result.product.weightKg} kg` : "—"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValue,
                { color: result.product.active ? "#22c55e" : "#ef4444" },
              ]}
            >
              {result.product.active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      )}

      {result?.type === "location" && result.location && (
        <View style={styles.resultCard}>
          <Text style={styles.resultType}>LOCATION</Text>
          <Text style={styles.resultName}>{result.location.name}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Barcode</Text>
            <Text style={styles.detailValue}>{result.location.barcode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{result.location.locationType}</Text>
          </View>
          {result.location.row && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Position</Text>
              <Text style={styles.detailValue}>
                Row {result.location.row}, Bay {result.location.bay}, Level{" "}
                {result.location.level}
              </Text>
            </View>
          )}
        </View>
      )}

      {result?.type === "not_found" && (
        <View style={styles.resultCard}>
          <Text style={styles.resultType}>NOT FOUND</Text>
          <Text style={styles.resultName}>No match for "{result.barcode}"</Text>
          <Text style={styles.notFoundHint}>
            This barcode doesn't match any product SKU or location in the system.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.scanAgain}
        onPress={() => {
          setScanning(true);
          setResult(null);
        }}
      >
        <Text style={styles.scanAgainText}>Scan Again</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    padding: 20,
  },
  resultCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  resultType: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8b5cf6",
    letterSpacing: 2,
    marginBottom: 8,
  },
  resultName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e1e2d",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  detailLabel: {
    fontSize: 13,
    color: "#4a4a68",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e1e2d",
  },
  notFoundHint: {
    fontSize: 13,
    color: "#4a4a68",
    marginTop: 8,
  },
  scanAgain: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  scanAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  backText: {
    color: "#4a4a68",
    fontSize: 14,
  },
});
