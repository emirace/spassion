import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useAuth } from "@/contexts/Auth";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useTheme, IconButton, Text } from "react-native-paper";
import { View, TouchableOpacity } from "react-native";
import { DrawerContent } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSyncOrders } from "@/contexts/syncOrder";

export default function Layout() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { syncFromServer, isSyncing, syncToServer } = useSyncOrders();

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [isSyncing]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!user) {
    return <Redirect href={"/auth"} />;
  }

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: colors.primary,
        headerShown: false,
      }}
      drawerContent={(props) => (
        <View style={{ flex: 1, padding: 10, paddingVertical: 20 }}>
          <Text style={{ paddingTop: 50, fontWeight: "600", fontSize: 20 }}>
            Welcome {user.username}
          </Text>
          <DrawerContent {...props} />
          <View style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 5,
                marginBottom: 15,
              }}
            >
              <Text style={{ fontSize: 18 }}>Sync</Text>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="sync" size={24} color={colors.onBackground} />
              </Animated.View>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                padding: 5,
                marginBottom: 10,
              }}
              onPress={syncToServer}
              disabled={isSyncing}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={24}
                color={colors.onBackground}
              />
              <Text>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                padding: 5,
              }}
              onPress={syncFromServer}
              disabled={isSyncing}
            >
              <Ionicons
                name="cloud-download-outline"
                size={24}
                color={colors.onBackground}
              />
              <Text>Download</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <IconButton
              icon="logout"
              mode="contained"
              onPress={logout}
              // style={{ backgroundColor: colors.primary }}
            />
          </View>
        </View>
      )}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Home",
          title: "Overview",
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          drawerLabel: "Product",
          title: "Overview",
          drawerItemStyle: user.role !== "manager" && { display: "none" },
        }}
      />
      <Drawer.Screen
        name="users"
        options={{
          drawerLabel: "Users",
          title: "Overview",
          drawerItemStyle: user.role !== "manager" && { display: "none" },
        }}
      />

      <Drawer.Screen
        name="allorders"
        options={{
          drawerLabel: "All Orders",
          title: "Overview",
          drawerItemStyle: user.role !== "manager" && { display: "none" },
        }}
      />
    </Drawer>
  );
}
