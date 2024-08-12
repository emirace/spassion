import ProductList from "@/components/ProductList";
import { useAuth } from "@/contexts/Auth";
import { useOrders } from "@/contexts/Order";
import { Item } from "@/types/item";
import { Order } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  Appbar,
  Card,
  Text,
  IconButton,
  useTheme,
  Button,
  Icon,
} from "react-native-paper";

export default function OrderDetail() {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  const { fetchOrder, addItemToOrder, removeItemFromOrder, markOrderAsPaid } =
    useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["100%"], []);

  const handleOpenBottomSheet = () => {
    bottomSheetModalRef.current?.present();
  };

  useEffect(() => {
    getOrder();
  }, []);

  const getOrder = async () => {
    const res = await fetchOrder(parseInt(id));
    if (res) {
      setOrder(res);
    }
  };

  const renderOrderItem = ({ item }: { item: Item & { quantity: number } }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 15,
        borderBottomColor: colors.elevation.level3,
        opacity: item.removed ? 0.2 : 1,
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
      <View style={styles.menuDetails}>
        <Text style={styles.menuTitle}>{item.name}</Text>
        <Text style={styles.menuPrice}>{item.price}</Text>
      </View>
      <View style={styles.menuActions}>
        <Text style={styles.menuQuantity}>QTY</Text>
        <Text style={{ fontWeight: "600", fontSize: 18 }}>{item.quantity}</Text>
        <IconButton
          icon="close"
          onPress={async () => {
            if (order?.paid) return;
            await removeItemFromOrder(order?.id!, item.id!);
            getOrder();
          }}
          iconColor="red"
          style={{ marginLeft: 20 }}
          disabled={item.removed || order?.paid}
        />
      </View>
    </View>
  );

  const renderHeader = () => (
    <View
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: dark ? "black" : "white",
          padding: 10,
          borderRadius: 50,
          marginBottom: 20,
        }}
      >
        <Icon source="account" size={24} />
        <View style={{ flex: 1 }}>
          <Text>Customer</Text>
          <Text style={{ fontWeight: "600", fontSize: 18, marginTop: 5 }}>
            {order?.customerName}
          </Text>
        </View>
      </View>

      {user?.role === "manager" && (
        <View
          style={{
            flexDirection: "row",
            gap: 5,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <Text>Waiter:</Text>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 18,
              backgroundColor: dark ? "black" : "white",
              padding: 5,
            }}
          >
            {order?.user}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 15 }}>
        <Text style={{ fontSize: 24, fontWeight: "600" }}>Items</Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 2,
            justifyContent: "center",
            paddingHorizontal: 10,
          }}
          onPress={handleOpenBottomSheet}
        >
          <Text style={{ color: "white" }}>Add item</Text>
        </TouchableOpacity>
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
          title={`Order ${order?.id}`}
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        <FlatList
          data={order?.items as any}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id?.toString() || ""}
          contentContainerStyle={styles.menuList}
          ListHeaderComponent={renderHeader}
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
              <Text style={styles.menuPrice}>#{order?.totalPrice}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await markOrderAsPaid(order?.id!);
              getOrder();
            }}
            style={{
              backgroundColor: order?.paid ? "gray" : "green",
              flexDirection: "row",
              borderRadius: 25,
              alignItems: "center",
              padding: 15,
              paddingHorizontal: 15,
              justifyContent: "center",
            }}
            disabled={order?.paid}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>
              Mark as Paid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleComponent={null}
      >
        <ProductList
          onClose={() => bottomSheetModalRef.current?.dismiss()}
          addItem={async (item) => {
            if (order?.paid) return;
            await addItemToOrder(order?.id!, item);
            getOrder();
          }}
        />
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    // marginTop: 30,
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
