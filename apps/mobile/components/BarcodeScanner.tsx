import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import * as Haptics from "expo-haptics";

type Props = {
  onScan: (data: string) => void;
  onClose: () => void;
  instruction?: string;
};

export function BarcodeScanner({ onScan, onClose, instruction }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [pendingScan, setPendingScan] = useState<{
    value: string;
    type: string;
  } | null>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera access is required for scanning
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleScan(result: BarcodeScanningResult) {
    if (pendingScan) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingScan({ value: result.data, type: result.type });
  }

  function handleConfirm() {
    if (!pendingScan) return;
    const value = pendingScan.value;
    setPendingScan(null);
    onScan(value);
  }

  function handleRetry() {
    setPendingScan(null);
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        autofocus="on"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["code128", "code39"],
        }}
        onBarcodeScanned={pendingScan ? undefined : handleScan}
      >
        <View style={styles.overlay}>
          {instruction && !pendingScan && (
            <View style={styles.instructionBar}>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          )}

          {!pendingScan && (
            <>
              {/* Rectangular scan guide */}
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.scanLine} />
              </View>

              <Text style={styles.hint}>Align barcode within the frame</Text>

              {/* Torch button */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    torchOn && styles.controlActive,
                  ]}
                  onPress={() => setTorchOn((prev) => !prev)}
                >
                  <Text style={styles.controlIcon}>🔦</Text>
                  <Text
                    style={[
                      styles.controlLabel,
                      torchOn && styles.controlLabelActive,
                    ]}
                  >
                    {torchOn ? "ON" : "OFF"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Confirmation overlay */}
          {pendingScan && (
            <View style={styles.confirmOverlay}>
              <Text style={styles.confirmLabel}>Scanned:</Text>
              <Text style={styles.confirmValue}>{pendingScan.value}</Text>
              <Text style={styles.confirmType}>
                {pendingScan.type.toUpperCase()}
              </Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                >
                  <Text style={styles.retryText}>Wrong — Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Correct ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </CameraView>

      {!pendingScan && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close Scanner</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  instructionBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(139,92,246,0.9)",
    borderRadius: 12,
    padding: 12,
  },
  instructionText: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },
  scanArea: { width: 300, height: 140, position: "relative" },
  corner: { position: "absolute", width: 35, height: 35, borderColor: "#8b5cf6", borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "rgba(139,92,246,0.6)",
    marginTop: -1,
  },
  hint: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 16, fontWeight: "500" },
  controlsRow: { position: "absolute", bottom: 120, flexDirection: "row", gap: 20 },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  controlActive: { backgroundColor: "rgba(139,92,246,0.7)", borderColor: "rgba(139,92,246,0.9)" },
  controlIcon: { fontSize: 20, marginBottom: 4 },
  controlLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  controlLabelActive: { color: "#fff" },
  confirmOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(30,30,45,0.95)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.5)",
  },
  confirmLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  confirmValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  confirmType: {
    color: "rgba(139,92,246,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 20,
  },
  confirmButtons: { flexDirection: "row", gap: 12, width: "100%" },
  retryButton: {
    flex: 1,
    backgroundColor: "rgba(180,19,64,0.2)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(180,19,64,0.5)",
  },
  retryText: { color: "#ff6b8a", fontSize: 13, fontWeight: "700" },
  confirmButton: {
    flex: 1,
    backgroundColor: "#8b5cf6",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  confirmButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  closeButton: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#1e1e2d",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  message: { color: "#fff", fontSize: 16, marginBottom: 20, textAlign: "center", paddingHorizontal: 20 },
  button: {
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  cancelButton: { paddingHorizontal: 24, paddingVertical: 12 },
  cancelText: { color: "#999", fontSize: 14 },
});
