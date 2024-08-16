import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Snackbar,
  ActivityIndicator,
  Appbar,
  useTheme,
} from "react-native-paper";
import { insertItem, updateItem } from "../storage/database"; // Adjust the import based on your file structure
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useItem } from "@/contexts/Item";
import axiosInstance from "@/servers/api";
import { SaveFormat, manipulateAsync } from "expo-image-manipulator";
import { useAuth } from "@/contexts/Auth";

const AddItemScreen: React.FC = () => {
  const { colors } = useTheme();
  const { addItem, fetchItem, updateItem, removeItem } = useItem();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const isEditing = Boolean(id);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());

  useEffect(() => {
    if (isEditing && id) {
      // Load the existing item data
      const loadItem = async () => {
        const item = await fetchItem(Number(id));
        if (item) {
          setName(item.name);
          setPrice(item.price.toString());
          setCategory(item.category);
          setDescription(item.description || "");
          setImageUrl(item.imageUrl || "");
          setStock(item.stock.toString());
          setCreatedAt(item.createdAt);
        }
      };
      loadItem();
    }
  }, [id, isEditing]);

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const pickImage = async () => {
    const hasMediaLibraryPermission = await requestMediaLibraryPermissions();
    if (!hasMediaLibraryPermission) {
      Alert.alert(
        "Permission required",
        "Media library access is required to select an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const path: any = await uploadImage(result.assets[0].uri);
      setImageUrl(path.url);
    }
  };

  const captureImage = async () => {
    const hasCameraPermission = await requestCameraPermissions();
    if (!hasCameraPermission) {
      Alert.alert(
        "Permission required",
        "Camera access is required to capture an image."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const path: any = await uploadImage(result);
      console.log(path);
      setImageUrl(path.url);
    }
  };

  const uploadImage = async (result: any) => {
    let localUri = result.assets[0].uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename!);
    let type = match ? `image/${match[1]}` : `image`;

    const maxSize = 1024;
    const img: any = await Image.resolveAssetSource(result);

    const { width, height } = img.assets[0];
    const aspectRatio = width / height;
    let newWidth, newHeight;
    if (aspectRatio >= 1) {
      newWidth = maxSize;
      newHeight = maxSize / aspectRatio;
    } else {
      newHeight = maxSize;
      newWidth = maxSize * aspectRatio;
    }
    console.log(newWidth, newHeight);
    try {
      setUploading(true);
      const resizedImage = await manipulateAsync(
        localUri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { format: SaveFormat.JPEG, compress: 0.8 } // Adjust the image format and compression quality as needed
      );

      console.log(resizedImage);

      const formData = new FormData();
      formData.append("file", {
        uri: resizedImage.uri,
        name: filename,
        type,
      } as unknown as File);

      const response = await axiosInstance.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = "Name is required.";
    if (!price || isNaN(parseFloat(price)))
      newErrors.price = "Valid price is required.";
    if (!category) newErrors.category = "Category is required.";
    if (!stock || isNaN(parseInt(stock)))
      newErrors.stock = "Valid stock is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const itemData = {
        name,
        price: parseFloat(price),
        category,
        description,
        imageUrl,
        stock: parseInt(stock),
        updatedAt: new Date(),
        createdAt: id ? createdAt : new Date(),
        user: user?.username || "",
      };

      if (isEditing && id) {
        await updateItem({ ...itemData, id: id as unknown as number });
      } else {
        await addItem(itemData);
      }

      setVisible(true);
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "add"} item. Please try again.`
      );
      console.error("Insert item error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          await removeItem(id as unknown as number);
          router.navigate("/products");
        },
        style: "default",
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={isEditing ? "Edit Item" : "Add New Item"}
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
        <Appbar.Action icon="delete" color="red" onPress={handleDelete} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Button mode="outlined" onPress={pickImage} style={styles.imageButton}>
          Choose from Gallery
        </Button>
        <Button
          mode="outlined"
          onPress={captureImage}
          style={styles.imageButton}
        >
          Take a Photo
        </Button>
        {uploading && <ActivityIndicator />}
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
        )}

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
          error={!!errors.name}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          label="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          error={!!errors.price}
        />
        {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}

        <TextInput
          label="Category"
          value={category}
          onChangeText={setCategory}
          style={styles.input}
          mode="outlined"
          error={!!errors.category}
        />
        {errors.category && (
          <Text style={styles.errorText}>{errors.category}</Text>
        )}

        <TextInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Stock"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          error={!!errors.stock}
        />
        {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : isEditing ? (
            "Update Item"
          ) : (
            "Add Item"
          )}
        </Button>
      </ScrollView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        action={{
          label: "Close",
          onPress: () => setVisible(false),
        }}
      >
        {isEditing ? "Item updated successfully!" : "Item added successfully!"}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 12,
  },
  imageButton: {
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
});

export default AddItemScreen;
