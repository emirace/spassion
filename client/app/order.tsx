import { useCart } from "@/contexts/Cart";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Appbar,
  Card,
  IconButton,
  useTheme,
  Button,
  Icon,
  Text,
} from "react-native-paper";
import { useState } from "react";
import { useOrders } from "@/contexts/Order";
import { Order as IOrder } from "../types/order";
import { useAuth } from "@/contexts/Auth";

export default function Order() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();
  const { addOrder } = useOrders();
  const [customerName, setCustomerName] = useState<string>("");

  const handleOrderCreation = () => {
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter the customer's name.");
      return;
    }

    const newOrder: IOrder = {
      customerName,
      items: cartItems,
      totalPrice: getTotalPrice(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
      paid: false,
      user: user?.username,
    };

    addOrder(newOrder);
    clearCart(); // Clear the cart after placing the order
    Alert.alert("Success", "Order has been placed successfully.");
    router.back(); // Navigate back to the previous screen
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 15,
        borderBottomColor: colors.elevation.level3,
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      <View style={styles.menuDetails}>
        <Text style={styles.menuTitle}>{item.name}</Text>
        <Text style={styles.menuPrice}>{item.price}</Text>
      </View>
      <View style={styles.menuActions}>
        <IconButton
          icon={item.quantity > 1 ? "minus-circle-outline" : "delete"}
          onPress={() =>
            item.quantity > 1
              ? decreaseQuantity(item.id)
              : removeFromCart(item.id)
          }
        />
        <Text style={styles.menuQuantity}>{item.quantity}</Text>
        <IconButton
          icon="plus-circle-outline"
          onPress={() => increaseQuantity(item.id)}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.elevation.level1 }}>
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title="Order 1"
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        <View
          style={
            {
              // flex: 1,
            }
          }
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: colors.background,
              padding: 10,
              borderRadius: 50,
              marginBottom: 20,
            }}
          >
            <Icon source="account" size={24} />
            <View style={{ flex: 1 }}>
              <Text>Customer</Text>
              <TextInput
                placeholder="Enter Name"
                style={{
                  marginTop: 5,
                  fontSize: 18,
                  color: colors.onBackground,
                }}
                value={customerName}
                onChangeText={(text) => setCustomerName(text)}
              />
            </View>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "600" }}>Items</Text>
        </View>
        <FlatList
          data={cartItems}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id?.toString() || ""}
          contentContainerStyle={styles.menuList}
        />
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.elevation.level3,
              borderRadius: 10,
              marginBottom: 20,
              padding: 10,
            }}
          >
            <View
              style={{
                borderBottomWidth: 1,
                paddingBottom: 10,
                marginBottom: 10,
                borderBottomColor: colors.elevation.level3,
              }}
            >
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 18,
                }}
              >
                Order Detail
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 18 }}>Total</Text>
              <Text style={styles.menuPrice}>{getTotalPrice()}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              flexDirection: "row",
              borderRadius: 25,
              alignItems: "center",
              padding: 15,
              paddingHorizontal: 15,
              justifyContent: "center",
            }}
            onPress={handleOrderCreation}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    flex: 1,
  },
  menuList: {
    flexGrow: 1,
    marginVertical: 10,
  },
  menuCard: {
    marginVertical: 5,
  },
  menuCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuImage: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: "black",
  },
  menuDetails: {
    flex: 1,
    marginLeft: 10,
  },
  menuTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  menuPrice: {
    fontWeight: "bold",
    fontSize: 18,
  },
  menuActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuQuantity: {
    marginHorizontal: 10,
    fontSize: 16,
  },
});
