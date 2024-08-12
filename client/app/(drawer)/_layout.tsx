import { useAuth } from "@/contexts/Auth";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useTheme, IconButton, Text } from "react-native-paper";
import { View } from "react-native";
import { DrawerContent } from "@react-navigation/drawer";

export default function Layout() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();

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
