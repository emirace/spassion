import { CartItem, useCart } from "@/contexts/Cart";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { View, StyleSheet, FlatList, Image } from "react-native";
import { Appbar, Card, IconButton, useTheme, Text } from "react-native-paper";
import { DrawerToggleButton } from "@react-navigation/drawer";

export default function HomeScreen() {
  const { colors } = useTheme();
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();

  const renderOrderItem = ({ item }: { item: CartItem }) => (
    <Card style={styles.menuCard} mode="outlined">
      <Card.Content style={styles.menuCardContent}>
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
                ? decreaseQuantity(item.id!)
                : removeFromCart(item.id!)
            }
          />
          <Text style={styles.menuQuantity}>{item.quantity}</Text>
          <IconButton
            icon="plus-circle-outline"
            onPress={() => increaseQuantity(item.id!)}
          />
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
        <DrawerToggleButton tintColor={colors.onBackground} />

        <Appbar.Content
          title="Spassion POS"
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
      </Appbar.Header>
      <View style={styles.content}>
        {cartItems.length > 0 ? (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id!.toString()}
              contentContainerStyle={styles.menuList}
            />
            <Link
              href="/order"
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                top: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.primary,
                  flexDirection: "row",
                  borderRadius: 25,
                  alignItems: "center",
                  width: "100%",
                  padding: 8,
                  paddingHorizontal: 15,
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "white", fontWeight: "500" }}>
                  Proceed New Order
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ color: "white" }}>#{getTotalPrice()}</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              </View>
            </Link>
          </>
        ) : (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "600", color: colors.primary }}
            >
              Click the + button to create new order
            </Text>
          </View>
        )}
        {cartItems.length > 0 && (
          <IconButton
            icon="delete"
            style={{
              backgroundColor: colors.primary,
            }}
            iconColor="white"
            size={24}
            onPress={() => clearCart()}
          />
        )}
      </View>
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
    marginVertical: 50,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  menuPrice: {
    color: "#757575",
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
