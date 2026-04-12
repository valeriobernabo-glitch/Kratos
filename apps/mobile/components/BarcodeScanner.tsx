import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  useBarcodeScanner,
  BarcodeFormat,
} from "@mgcrea/vision-camera-barcode-scanner";
import * as Haptics from "expo-haptics";

type Props = {
  onScan: (data: string) => void;
  onClose: () => void;
  instruction?: string;
};

export function BarcodeScanner({ onScan, onClose, instruction }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const device = useCameraDevice("back");

  const { props: cameraProps } = useBarcodeScanner({
    fps: 5,
    barcodeTypes: [
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_128,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
    ],
    callbacks: {
      onBarcodeScanned: (barcodes) => {
        if (scanned || barcodes.length === 0) return;
        const barcode = barcodes[0];
        const value = barcode?.value;
        if (!value) return;

        console.log(`[SCAN] format=${barcode?.format} value=${value}`);
        setScanned(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onScan(value);
      },
    },
  });

  if (!hasPermission) {
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

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No camera device found</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        torch={torchOn ? "on" : "off"}
        enableZoomGesture={true}
        {...cameraProps}
      />

      {/* Overlay */}
      <View style={styles.overlayContainer}>
        {instruction && (
          <View style={styles.instructionBar}>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        )}

        {/* Rectangular scan guide */}
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <View style={styles.scanLine} />
        </View>

        <Text style={styles.hint}>
          Align barcode within the frame{"\n"}
          Pinch to zoom
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, torchOn && styles.controlActive]}
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

        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>Close Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionBar: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(139,92,246,0.9)",
    borderRadius: 12,
    padding: 12,
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  scanArea: {
    width: 300,
    height: 140,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 35,
    height: 35,
    borderColor: "#8b5cf6",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "rgba(139,92,246,0.6)",
    marginTop: -1,
  },
  hint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  controlsRow: {
    position: "absolute",
    bottom: 120,
    flexDirection: "row",
    gap: 20,
  },
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
  controlActive: {
    backgroundColor: "rgba(139,92,246,0.7)",
    borderColor: "rgba(139,92,246,0.9)",
  },
  controlIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  controlLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  controlLabelActive: {
    color: "#fff",
  },
  rescanButton: {
    position: "absolute",
    bottom: 70,
    backgroundColor: "rgba(139,92,246,0.9)",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  rescanText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#1e1e2d",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    zIndex: 10,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelText: {
    color: "#999",
    fontSize: 14,
  },
});
