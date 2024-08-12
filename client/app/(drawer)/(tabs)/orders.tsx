import { useOrders } from "@/contexts/Order";
import { router } from "expo-router";
import moment from "moment";
import { FlatList, StyleSheet, View } from "react-native";
import {
  useTheme,
  Appbar,
  Card,
  Text,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import { Order as IOrder, Order } from "../../../types/order";
import { useEffect, useState } from "react";

export default function Orders() {
  const { colors } = useTheme();
  const { fetchUserOrders, userOrders: orders } = useOrders();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError("");
        setLoading(true);
        await fetchUserOrders();
      } catch (error) {
        setError("Unable to fetch orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }: { item: IOrder }) => (
    <Card
      style={styles.menuCard}
      mode="outlined"
      onPress={() =>
        router.push({ pathname: "/orderdetail", params: { id: item.id } })
      }
    >
      <Card.Content style={styles.menuCardContent}>
        <View style={styles.menuDetails}>
          <Text style={styles.menuPrice}>Customer</Text>
          <Text style={styles.menuTitle}>{item.customerName}</Text>
        </View>
        <View>
          <Text style={styles.menuTitle}>Order {item.id}</Text>
          <Text style={styles.menuPrice}>
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{ fontWeight: "500", color: item.paid ? "green" : "red" }}
          >
            {item.paid ? "Paid" : "Unpaid"}
          </Text>

          <IconButton icon="chevron-right" size={24} />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <Appbar.Content
          title="Orders"
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id?.toString() || ""}
            contentContainerStyle={styles.menuList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },

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
    justifyContent: "space-between",
  },
  menuDetails: {
    marginLeft: 10,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuPrice: {
    color: "#757575",
  },
});
