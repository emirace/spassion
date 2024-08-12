import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { paperColors } from "@/constants/Colors";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/Auth";
import { OrdersProvider } from "@/contexts/Order";
import { SyncOrdersProvider } from "@/contexts/syncOrder";
import { ItemProvider } from "@/contexts/Item";
import { CartProvider } from "@/contexts/Cart";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  const paperTheme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: paperColors.dark }
      : { ...MD3LightTheme, colors: paperColors.light };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={paperTheme}>
        <GestureHandlerRootView>
          <AuthProvider>
            <SyncOrdersProvider>
              <OrdersProvider>
                <ItemProvider>
                  <CartProvider>
                    <BottomSheetModalProvider>
                      <Stack initialRouteName="auth">
                        <Stack.Screen
                          name="auth"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="(drawer)"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="order"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="additem"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="adduser"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="orderdetail"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                    </BottomSheetModalProvider>
                  </CartProvider>
                </ItemProvider>
              </OrdersProvider>
            </SyncOrdersProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </ThemeProvider>
  );
}
