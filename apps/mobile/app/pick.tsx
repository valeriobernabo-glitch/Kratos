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

type WavePick = {
  id: string;
  carrier: string;
  status: string;
  createdAt: string;
  orderCount: number;
  itemCount: number;
  pickedCount: number;
};

type WaveItem = {
  id: string;
  productId: string;
  locationId: string;
  totalQty: number;
  pickedQty: number;
  productName: string;
  productSku: string;
  productBarcode: string | null;
  locationName: string;
  locationBarcode: string | null;
};

type WaveOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
};

type WaveDetail = WavePick & { orders: WaveOrder[]; items: WaveItem[] };

const CARRIER_LABELS: Record<string, string> = {
  auspost: "AusPost",
  tge: "TGE",
  toll: "Toll",
  allied_express: "Allied Express",
  tnt: "TNT",
  other: "Other",
};

export default function PickScreen() {
  const [step, setStep] = useState<"list" | "wave" | "scan">("list");
  const [waves, setWaves] = useState<WavePick[]>([]);
  const [wave, setWave] = useState<WaveDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaves();
  }, []);

  async function fetchWaves() {
    setLoading(true);
    try {
      const created = await api<{ data: WavePick[] }>(
        "/api/wave-picks?status=created&pageSize=50",
      );
      const inProgress = await api<{ data: WavePick[] }>(
        "/api/wave-picks?status=in_progress&pageSize=50",
      );
      setWaves([...inProgress.data, ...created.data]);
    } catch {
      setWaves([]);
    } finally {
      setLoading(false);
    }
  }

  async function openWave(id: string) {
    try {
      const result = await api<{ data: WaveDetail }>(`/api/wave-picks/${id}`);
      setWave(result.data);
      setStep("wave");
    } catch {
      Alert.alert("Error", "Failed to load wave");
    }
  }

  async function refreshWave() {
    if (!wave) return;
    try {
      const result = await api<{ data: WaveDetail }>(
        `/api/wave-picks/${wave.id}`,
      );
      setWave(result.data);
    } catch {
      // ignore
    }
  }

  async function markItemPicked(itemId: string, qty: number) {
    if (!wave) return;
    try {
      await api(`/api/wave-picks/${wave.id}/items/${itemId}/pick`, {
        method: "PUT",
        body: JSON.stringify({ pickedQty: qty }),
      });
      await refreshWave();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to record pick",
      );
    }
  }

  async function completeWave() {
    if (!wave) return;
    try {
      await api(`/api/wave-picks/${wave.id}/complete`, { method: "POST" });
      Alert.alert("Wave complete", "Orders moved to Awaiting Pack", [
        {
          text: "OK",
          onPress: () => {
            setWave(null);
            setStep("list");
            fetchWaves();
          },
        },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to complete",
      );
    }
  }

  function handleScan(barcode: string) {
    if (!wave) {
      setStep("wave");
      return;
    }

    // Find first unpicked item whose location or product barcode matches
    const pending = wave.items.filter((i) => i.pickedQty < i.totalQty);
    const match = pending.find(
      (i) =>
        i.locationBarcode === barcode ||
        i.productBarcode === barcode ||
        i.productSku === barcode ||
        i.locationName === barcode,
    );

    if (!match) {
      Alert.alert(
        "No match",
        `Scanned "${barcode}" does not match any pending pick task.`,
      );
      setStep("wave");
      return;
    }

    // Auto-pick full qty for the matched item
    markItemPicked(match.id, match.totalQty);
    setStep("wave");
  }

  // Scanner
  if (step === "scan") {
    return (
      <BarcodeScanner
        instruction="Scan location or product barcode"
        onScan={handleScan}
        onClose={() => setStep("wave")}
      />
    );
  }

  // Wave detail
  if (step === "wave" && wave) {
    const pending = wave.items.filter((i) => i.pickedQty < i.totalQty);
    const done = wave.items.length - pending.length;
    const allDone = pending.length === 0 && wave.items.length > 0;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.waveHeader}>
          <Text style={styles.waveCarrier}>
            {CARRIER_LABELS[wave.carrier] ?? wave.carrier}
          </Text>
          <Text style={styles.waveSubtitle}>
            {wave.orders.length} orders · {wave.items.length} tasks
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(done / Math.max(1, wave.items.length)) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {done} of {wave.items.length} complete
          </Text>
        </View>

        {/* Scan button */}
        {pending.length > 0 && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setStep("scan")}
          >
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan Location or Product</Text>
          </TouchableOpacity>
        )}

        {/* Pending tasks */}
        {pending.map((item, idx) => (
          <PickTaskCard
            key={item.id}
            item={item}
            index={idx}
            onConfirm={(qty) => markItemPicked(item.id, qty)}
          />
        ))}

        {/* Done section */}
        {done > 0 && (
          <View style={styles.doneSection}>
            <Text style={styles.sectionTitle}>Completed ({done})</Text>
            {wave.items
              .filter((i) => i.pickedQty >= i.totalQty)
              .map((item) => (
                <View key={item.id} style={styles.doneCard}>
                  <Text style={styles.doneLocation}>{item.locationName}</Text>
                  <Text style={styles.doneProduct}>{item.productName}</Text>
                  <Text style={styles.doneQty}>✓ {item.pickedQty}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Complete button */}
        {allDone && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeWave}
          >
            <Text style={styles.completeText}>Complete Wave</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setWave(null);
            setStep("list");
          }}
        >
          <Text style={styles.backText}>Back to Wave List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Wave list
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Open Wave Picks</Text>
      <Text style={styles.helperText}>
        Select a wave to start picking. Create waves from the web dashboard.
      </Text>

      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : waves.length === 0 ? (
        <Text style={styles.empty}>
          No open wave picks. Create one from the web dashboard.
        </Text>
      ) : (
        waves.map((w) => (
          <TouchableOpacity
            key={w.id}
            style={styles.waveCard}
            onPress={() => openWave(w.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.waveCardCarrier}>
                {CARRIER_LABELS[w.carrier] ?? w.carrier}
              </Text>
              <Text style={styles.waveCardMeta}>
                {w.orderCount} orders · {w.itemCount} items
              </Text>
              <Text style={styles.waveCardDate}>
                {new Date(w.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.waveStatusBadge}>
              <Text style={styles.waveStatusText}>
                {w.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function PickTaskCard({
  item,
  index,
  onConfirm,
}: {
  item: WaveItem;
  index: number;
  onConfirm: (qty: number) => void;
}) {
  const [qty, setQty] = useState(String(item.totalQty));

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskIndex}>#{index + 1}</Text>
        <View style={styles.taskLocation}>
          <Text style={styles.taskLocationText}>{item.locationName}</Text>
        </View>
      </View>
      <Text style={styles.taskProduct}>{item.productName}</Text>
      <Text style={styles.taskSku}>{item.productSku}</Text>

      <View style={styles.taskQtyRow}>
        <Text style={styles.taskQtyLabel}>Pick</Text>
        <TextInput
          style={styles.taskQtyInput}
          value={qty}
          onChangeText={setQty}
          keyboardType="numeric"
        />
        <Text style={styles.taskQtyMax}>/ {item.totalQty}</Text>
      </View>

      <TouchableOpacity
        style={styles.taskConfirm}
        onPress={() => {
          const n = Number(qty);
          if (isNaN(n) || n < 0) {
            Alert.alert("Invalid qty", "Enter a valid number");
            return;
          }
          onConfirm(n);
        }}
      >
        <Text style={styles.taskConfirmText}>Confirm Pick</Text>
      </TouchableOpacity>
    </View>
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
  waveCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  waveCardCarrier: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  waveCardMeta: {
    fontSize: 12,
    color: "#4a4a68",
    marginTop: 2,
  },
  waveCardDate: {
    fontSize: 11,
    color: "#4a4a68",
    marginTop: 4,
  },
  waveStatusBadge: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  waveStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8b5cf6",
    letterSpacing: 1,
  },
  waveHeader: {
    marginBottom: 16,
  },
  waveCarrier: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e1e2d",
  },
  waveSubtitle: {
    fontSize: 13,
    color: "#4a4a68",
    marginTop: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8b5cf6",
  },
  progressText: {
    fontSize: 11,
    color: "#4a4a68",
    marginTop: 6,
    fontWeight: "600",
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
  taskCard: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.2)",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  taskIndex: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4a4a68",
    marginRight: 12,
  },
  taskLocation: {
    backgroundColor: "#1e1e2d",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  taskLocationText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  taskProduct: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e1e2d",
    marginBottom: 2,
  },
  taskSku: {
    fontSize: 12,
    color: "#4a4a68",
    fontFamily: "monospace",
    marginBottom: 14,
  },
  taskQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  taskQtyLabel: {
    fontSize: 12,
    color: "#4a4a68",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  taskQtyInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "monospace",
    minWidth: 80,
    textAlign: "center",
    color: "#1e1e2d",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.3)",
  },
  taskQtyMax: {
    fontSize: 16,
    color: "#4a4a68",
    fontFamily: "monospace",
  },
  taskConfirm: {
    backgroundColor: "#8b5cf6",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  taskConfirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  doneSection: {
    marginTop: 20,
  },
  doneCard: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  doneLocation: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "800",
    color: "#15803d",
    width: 80,
  },
  doneProduct: {
    fontSize: 12,
    color: "#1e1e2d",
    flex: 1,
  },
  doneQty: {
    fontSize: 14,
    fontWeight: "800",
    color: "#15803d",
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
