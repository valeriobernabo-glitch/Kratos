import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { api } from "../lib/api";
import { BarcodeScanner } from "../components/BarcodeScanner";

type PurchaseOrder = {
  id: string;
  supplierName: string;
  status: string;
  expectedDate: string | null;
  createdAt: string;
};

type POLine = {
  id: string;
  productId: string;
  expectedQty: number;
  receivedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
};

type PODetail = PurchaseOrder & { lines: POLine[] };

export default function ReceiveScreen() {
  const [step, setStep] = useState<"list" | "po" | "scan-product" | "scan-location">("list");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const result = await api<{ data: PurchaseOrder[] }>(
        "/api/purchase-orders?status=draft&pageSize=50",
      );
      const awaiting = await api<{ data: PurchaseOrder[] }>(
        "/api/purchase-orders?status=awaiting_arrival&pageSize=50",
      );
      const receiving = await api<{ data: PurchaseOrder[] }>(
        "/api/purchase-orders?status=receiving&pageSize=50",
      );
      setOrders([...receiving.data, ...awaiting.data, ...result.data]);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectPO(id: string) {
    try {
      const result = await api<{ data: PODetail }>(`/api/purchase-orders/${id}`);
      setSelectedPO(result.data);
      setStep("po");
    } catch {
      Alert.alert("Error", "Failed to load purchase order");
    }
  }

  async function handleProductScan(barcode: string) {
    if (!selectedPO) return;

    const line = selectedPO.lines.find(
      (l) => l.productBarcode === barcode || l.productSku === barcode,
    );

    if (!line) {
      Alert.alert("Not Found", `No product matching barcode "${barcode}" in this PO`);
      setStep("po");
      return;
    }

    const newQty = line.receivedQty + 1;

    try {
      await api(`/api/purchase-orders/${selectedPO.id}/lines/${line.id}/receive`, {
        method: "PUT",
        body: JSON.stringify({ receivedQty: newQty }),
      });

      const result = await api<{ data: PODetail }>(
        `/api/purchase-orders/${selectedPO.id}`,
      );
      setSelectedPO(result.data);
    } catch {
      Alert.alert("Error", "Failed to update received quantity");
    }

    setStep("po");
  }

  async function handleLocationScan(barcode: string) {
    try {
      const result = await api<{ data: Array<{ id: string; name: string }> }>(
        `/api/locations?search=${barcode}&pageSize=1`,
      );

      if (result.data.length === 0) {
        Alert.alert("Not Found", `No location matching "${barcode}"`);
        setStep("po");
        return;
      }

      setSelectedLocationId(result.data[0]!.id);
      setSelectedLocationName(result.data[0]!.name);
      setStep("po");
    } catch {
      Alert.alert("Error", "Failed to look up location");
      setStep("po");
    }
  }

  async function completeReceiving() {
    if (!selectedPO || !selectedLocationId) {
      Alert.alert("Location Required", "Scan a location barcode first");
      return;
    }

    try {
      await api(`/api/purchase-orders/${selectedPO.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ locationId: selectedLocationId }),
      });
      Alert.alert("Complete", "Stock has been received and added to inventory", [
        { text: "OK", onPress: () => { setStep("list"); setSelectedPO(null); fetchOrders(); } },
      ]);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to complete");
    }
  }

  // Scanner screens
  if (step === "scan-product") {
    return (
      <BarcodeScanner
        instruction="Scan product barcode"
        onScan={handleProductScan}
        onClose={() => setStep("po")}
      />
    );
  }

  if (step === "scan-location") {
    return (
      <BarcodeScanner
        instruction="Scan location barcode"
        onScan={handleLocationScan}
        onClose={() => setStep("po")}
      />
    );
  }

  // PO Detail
  if (step === "po" && selectedPO) {
    const allReceived = selectedPO.lines.every(
      (l) => l.receivedQty >= l.expectedQty,
    );

    return (
      <ScrollView style={styles.container}>
        <View style={styles.poHeader}>
          <Text style={styles.poSupplier}>{selectedPO.supplierName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{selectedPO.status.replace("_", " ")}</Text>
          </View>
        </View>

        {/* Scan buttons */}
        <View style={styles.scanRow}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setStep("scan-product")}
          >
            <Text style={styles.scanButtonIcon}>📦</Text>
            <Text style={styles.scanButtonText}>Scan Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scanButton, styles.scanButtonSecondary]}
            onPress={() => setStep("scan-location")}
          >
            <Text style={styles.scanButtonIcon}>📍</Text>
            <Text style={styles.scanButtonText}>Scan Location</Text>
          </TouchableOpacity>
        </View>

        {selectedLocationName && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationLabel}>Receiving to:</Text>
            <Text style={styles.locationName}>{selectedLocationName}</Text>
          </View>
        )}

        {/* Lines */}
        {selectedPO.lines.map((line) => (
          <View key={line.id} style={styles.lineCard}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{line.productName}</Text>
              <Text style={styles.lineSku}>{line.productSku}</Text>
            </View>
            <View style={styles.lineQty}>
              <Text
                style={[
                  styles.lineReceived,
                  line.receivedQty >= line.expectedQty && styles.lineComplete,
                ]}
              >
                {line.receivedQty}
              </Text>
              <Text style={styles.lineExpected}>/ {line.expectedQty}</Text>
            </View>
          </View>
        ))}

        {/* Complete button */}
        {allReceived && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              !selectedLocationId && styles.completeButtonDisabled,
            ]}
            onPress={completeReceiving}
            disabled={!selectedLocationId}
          >
            <Text style={styles.completeText}>
              {selectedLocationId
                ? "Complete Receiving"
                : "Scan location first"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setStep("list");
            setSelectedPO(null);
            setSelectedLocationId(null);
            setSelectedLocationName(null);
          }}
        >
          <Text style={styles.backText}>Back to PO List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // PO List
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Select Purchase Order</Text>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>
          No purchase orders to receive. Create one from the web dashboard.
        </Text>
      ) : (
        orders.map((po) => (
          <TouchableOpacity
            key={po.id}
            style={styles.poCard}
            onPress={() => selectPO(po.id)}
          >
            <View>
              <Text style={styles.poCardSupplier}>{po.supplierName}</Text>
              <Text style={styles.poCardDate}>
                {new Date(po.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {po.status.replace("_", " ")}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e1e2d",
    marginBottom: 16,
  },
  empty: {
    color: "#4a4a68",
    textAlign: "center",
    marginTop: 40,
  },
  poCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  poCardSupplier: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e2d",
  },
  poCardDate: {
    fontSize: 12,
    color: "#4a4a68",
    marginTop: 2,
  },
  poHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  poSupplier: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  statusBadge: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8b5cf6",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scanRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  scanButtonSecondary: {
    backgroundColor: "#6c4d8f",
  },
  scanButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  locationBanner: {
    backgroundColor: "rgba(139,92,246,0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: "#4a4a68",
  },
  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8b5cf6",
  },
  lineCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e1e2d",
  },
  lineSku: {
    fontSize: 11,
    color: "#4a4a68",
    marginTop: 2,
    fontFamily: "monospace",
  },
  lineQty: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  lineReceived: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  lineComplete: {
    color: "#22c55e",
  },
  lineExpected: {
    fontSize: 14,
    color: "#4a4a68",
    marginLeft: 2,
  },
  completeButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  completeButtonDisabled: {
    backgroundColor: "#999",
  },
  completeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 40,
  },
  backText: {
    color: "#4a4a68",
    fontSize: 14,
  },
});
