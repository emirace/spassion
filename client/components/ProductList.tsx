import {
  StyleSheet,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import React, { useState, useMemo } from "react";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Appbar, Text, Icon, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useItem } from "@/contexts/Item";
import { Item } from "@/types/item";
import { useCart } from "@/contexts/Cart";
import { router } from "expo-router";

interface Props {
  onClose: () => void;
  addItem?: (itemId: Item) => void;
}

const numColumns = 3;

const ProductList: React.FC<Props> = ({ onClose, addItem }) => {
  const { colors } = useTheme();
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { items, categories } = useItem();

  // Filter items based on selected category and search term
  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        selectedCategory ? item.category === selectedCategory : true
      )
      .filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [items, selectedCategory, searchTerm]);

  const handleAddToCart = (item: Item) => {
    if (addItem) {
      addItem(item);
    } else {
      addToCart(item, 1);
      router.navigate("/");
    }
    onClose();
  };

  const renderMenuItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.category,
        selectedCategory === item
          ? {
              borderColor: colors.primary,
              backgroundColor: colors.elevation.level1,
            }
          : { borderColor: colors.elevation.level5 },
      ]}
      onPress={() =>
        selectedCategory === item
          ? setSelectedCategory("")
          : setSelectedCategory(item)
      }
    >
      <Text style={styles.categoryText}>{item}</Text>
    </TouchableOpacity>
  );

  const WIDTH = Dimensions.get("screen").width;
  const renderProduct = ({ item }: { item: Item }) => (
    <TouchableOpacity
      onPress={() => handleAddToCart(item)}
      style={{
        width: WIDTH / 3 - 23,
        borderColor: colors.elevation.level5,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: "center",
        margin: 5,
        padding: 10,
      }}
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
    <BottomSheetView style={styles.bottomSheetContent}>
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <Appbar.Action icon="close" onPress={onClose} />
        <Appbar.Content
          title="Product List"
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
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
            style={styles.textInput}
            placeholder="Search Menu"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={{ fontSize: 18, fontWeight: "500", marginTop: 10 }}>
          Select Category
        </Text>
        <FlatList
          data={categories}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.menuList}
          horizontal
        />
        <Text style={{ fontSize: 18, fontWeight: "500", marginTop: 10 }}>
          Select Product{" "}
        </Text>
        {filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id?.toString() || ""}
            numColumns={numColumns}
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
    </BottomSheetView>
  );
};

export default ProductList;

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
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
  menuList: {
    marginVertical: 10,
    gap: 10,
  },
  category: {
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  categoryImage: {
    width: 40,
    height: 40,
    backgroundColor: "black",
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryText: { fontWeight: "500", fontSize: 18 },
});
