import { Tabs } from "expo-router";
import React, { useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { FAB, useTheme, Text } from "react-native-paper";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import ProductList from "@/components/ProductList";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["100%"], []);

  const handleOpenBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  return (
    <BottomSheetModalProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Cart",
              tabBarActiveTintColor: colors.primary,
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  name={focused ? "cart" : "cart-outline"}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="orders"
            options={{
              title: "Orders",
              tabBarActiveTintColor: colors.primary,
              tabBarIcon: ({ color }) => (
                <TabBarIcon name="list" color={color} />
              ),
            }}
          />
        </Tabs>

        {/* Floating Action Button */}
        <FAB
          style={[styles.fab, { backgroundColor: colors.primary }]}
          icon="plus"
          color="white"
          size="large"
          mode="elevated"
          onPress={handleOpenBottomSheet}
        />

        {/* Bottom Sheet Modal */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: colors.background }}
          handleComponent={null}
        >
          <ProductList onClose={() => bottomSheetModalRef.current?.dismiss()} />
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 50,
    left: "50%",
    marginLeft: -50,
    borderRadius: 50,
  },
});
