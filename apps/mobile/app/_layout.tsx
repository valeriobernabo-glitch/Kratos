import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1e1e2d" },
          headerTintColor: "#f8f7ff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#f8f7ff" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Kratos WMS" }} />
        <Stack.Screen name="receive" options={{ title: "Receive Stock" }} />
        <Stack.Screen
          name="scan"
          options={{ title: "Scanner", presentation: "modal" }}
        />
      </Stack>
    </>
  );
}
