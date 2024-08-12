import {
  FlatList,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import React, { useMemo, useState } from "react";
import { Appbar, useTheme, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useItem } from "@/contexts/Item";
import { Item } from "@/types/item";
import { router } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";

const Products = () => {
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { items } = useItem();

  // Filter items based on selected category and search term
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const WIDTH = Dimensions.get("screen").width;

  const renderProduct = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={{
        width: WIDTH / 3 - 23,
        borderColor: colors.elevation.level5,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: "center",
        margin: 5,
        padding: 10,
      }}
      onPress={() =>
        router.push({ pathname: "/additem", params: { id: item.id } })
      }
    >
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
        style={{
          backgroundColor: "black",
          width: WIDTH / 3 - 43,
          height: WIDTH / 3 - 43,
          borderRadius: 15,
        }}
      />
      <Text style={{ fontWeight: "500" }}>{item.name}</Text>
      <Text>#{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <DrawerToggleButton tintColor={colors.onBackground} />
        <Appbar.Content
          title="Product "
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
        <Appbar.Action icon={"plus"} onPress={() => router.push("/additem")} />
      </Appbar.Header>

      <View
        style={{
          backgroundColor: colors.elevation.level1,
          paddingHorizontal: 20,
          paddingBottom: 10,
        }}
      >
        <View
          style={[
            styles.search,
            {
              borderColor: colors.elevation.level5,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Ionicons name="search" size={24} color={colors.onBackground} />
          <TextInput
            style={[styles.textInput, { color: colors.onBackground }]}
            placeholder="Search Menu"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id?.toString() || ""}
          numColumns={3}
          contentContainerStyle={{ paddingBottom: 300 }}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 10 }}
        />
      ) : (
        <Text style={{ padding: 30, color: colors.primary, fontSize: 18 }}>
          No Product
        </Text>
      )}
    </View>
  );
};

export default Products;

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 10,
    borderRadius: 30,
    // backgroundColor: "#ffffff",
    gap: 5,
    marginBottom: 10,
  },
  textInput: { flex: 1, fontSize: 20 },
});
