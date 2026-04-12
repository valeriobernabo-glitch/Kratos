import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { api } from "../lib/api";
import { BarcodeScanner } from "../components/BarcodeScanner";

type SalesOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  carrier: string;
  status: string;
  createdAt: string;
};

type SOLine = {
  id: string;
  productId: string;
  orderedQty: number;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
};

type SODetail = SalesOrder & {
  lines: SOLine[];
  allocations: unknown[];
};

const CARRIER_LABELS: Record<string, string> = {
  auspost: "AusPost",
  tge: "TGE",
  toll: "Toll",
  allied_express: "Allied Express",
  tnt: "TNT",
  other: "Other",
};

export default function PackScreen() {
  const [step, setStep] = useState<"list" | "order" | "scan" | "ship">(
    "list",
  );
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [order, setOrder] = useState<SODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const awaitingPack = await api<{ data: SalesOrder[] }>(
        "/api/sales-orders?status=awaiting_pack&pageSize=50",
      );
      const packed = await api<{ data: SalesOrder[] }>(
        "/api/sales-orders?status=packed&pageSize=50",
      );
      setOrders([...awaitingPack.data, ...packed.data]);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function openOrder(id: string) {
    try {
      const result = await api<{ data: SODetail }>(
        `/api/sales-orders/${id}`,
      );
      setOrder(result.data);
      setStep(result.data.status === "packed" ? "ship" : "order");
    } catch {
      Alert.alert("Error", "Failed to load order");
    }
  }

  async function refreshOrder() {
    if (!order) return;
    try {
      const result = await api<{ data: SODetail }>(
        `/api/sales-orders/${order.id}`,
      );
      setOrder(result.data);
    } catch {
      // ignore
    }
  }

  async function markPacked() {
    if (!order) return;
    try {
      await api(`/api/sales-orders/${order.id}/pack`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await refreshOrder();
      setStep("ship");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to pack",
      );
    }
  }

  async function shipOrder() {
    if (!order) return;
    if (!tracking.trim()) {
      Alert.alert("Tracking required", "Enter a tracking number");
      return;
    }
    try {
      await api(`/api/sales-orders/${order.id}/ship`, {
        method: "POST",
        body: JSON.stringify({ trackingNumber: tracking.trim() }),
      });
      Alert.alert("Shipped", `Order ${order.orderNumber} marked as shipped`, [
        {
          text: "OK",
          onPress: () => {
            setOrder(null);
            setTracking("");
            setStep("list");
            fetchOrders();
          },
        },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to ship",
      );
    }
  }

  function handleScan(barcode: string) {
    // Scanner mode in pack: scan order barcode to select an order from the list.
    const match = orders.find(
      (o) => o.orderNumber === barcode || o.id === barcode,
    );
    if (match) {
      openOrder(match.id);
    } else {
      Alert.alert(
        "Not found",
        `No order matching "${barcode}" in the awaiting-pack list.`,
      );
      setStep("list");
    }
  }

  if (step === "scan") {
    return (
      <BarcodeScanner
        instruction="Scan order barcode"
        onScan={handleScan}
        onClose={() => setStep("list")}
      />
    );
  }

  // Ship step (order is already packed)
  if (step === "ship" && order) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {order.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Enter tracking number</Text>
        <Text style={styles.helperText}>
          Carrier: {CARRIER_LABELS[order.carrier] ?? order.carrier}
        </Text>

        <TextInput
          style={styles.trackingInput}
          value={tracking}
          onChangeText={setTracking}
          placeholder="e.g. AP1234567890AU"
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.completeButton} onPress={shipOrder}>
          <Text style={styles.completeText}>Mark as Shipped</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setOrder(null);
            setTracking("");
            setStep("list");
          }}
        >
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Order detail (pack step)
  if (step === "order" && order) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {order.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items to pack</Text>

        {order.lines.map((line) => (
          <View key={line.id} style={styles.lineCard}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{line.productName}</Text>
              <Text style={styles.lineSku}>{line.productSku}</Text>
            </View>
            <View style={styles.lineQty}>
              <Text style={styles.linePicked}>{line.pickedQty}</Text>
              <Text style={styles.lineMax}>picked</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.completeButton} onPress={markPacked}>
          <Text style={styles.completeText}>Mark as Packed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setOrder(null);
            setStep("list");
          }}
        >
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // List
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Orders to Pack & Ship</Text>
      <Text style={styles.helperText}>
        Shows orders in &quot;Awaiting Pack&quot; and &quot;Packed&quot; status.
      </Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setStep("scan")}
      >
        <Text style={styles.scanButtonIcon}>📷</Text>
        <Text style={styles.scanButtonText}>Scan Order Number</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>
          No orders awaiting pack. Pick some orders first.
        </Text>
      ) : (
        orders.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={styles.orderCard}
            onPress={() => openOrder(o.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.orderCardNumber}>{o.orderNumber}</Text>
              <Text style={styles.orderCardCustomer}>{o.customerName}</Text>
              <Text style={styles.orderCardMeta}>
                {CARRIER_LABELS[o.carrier] ?? o.carrier}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                o.status === "packed" && styles.statusBadgePacked,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  o.status === "packed" && styles.statusTextPacked,
                ]}
              >
                {o.status.replace("_", " ")}
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
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#4a4a68",
    marginBottom: 16,
  },
  empty: {
    color: "#4a4a68",
    textAlign: "center",
    marginTop: 40,
  },
  scanButton: {
    backgroundColor: "#8b5cf6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scanButtonIcon: {
    fontSize: 22,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  orderCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  orderCardNumber: {
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#1e1e2d",
  },
  orderCardCustomer: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e1e2d",
    marginTop: 2,
  },
  orderCardMeta: {
    fontSize: 11,
    color: "#4a4a68",
    marginTop: 4,
  },
  orderHeader: {
    marginBottom: 20,
    alignItems: "flex-start",
  },
  orderNumber: {
    fontSize: 14,
    color: "#4a4a68",
    fontFamily: "monospace",
  },
  orderCustomer: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e1e2d",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8b5cf6",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusBadgePacked: {
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  statusTextPacked: {
    color: "#15803d",
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
    alignItems: "flex-end",
  },
  linePicked: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  lineMax: {
    fontSize: 10,
    color: "#4a4a68",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  trackingInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: "monospace",
    marginBottom: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.3)",
    color: "#1e1e2d",
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
