import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Snackbar,
  ActivityIndicator,
  Appbar,
  useTheme,
  RadioButton,
} from "react-native-paper";
import { useAuth } from "@/contexts/Auth";
import { router, useLocalSearchParams } from "expo-router";
import axiosInstance from "@/servers/api";
import { User } from "@/types/user";

const AddUserScreen: React.FC = () => {
  const { colors } = useTheme();
  const { register, deleteUser } = useAuth();
  const { id } = useLocalSearchParams() as { id: string };

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"waiter" | "manager">("waiter");
  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fetchingUser, setFetchingUser] = useState(id ? true : false);

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        setFetchingUser(true);
        const response = await axiosInstance.get<User>(`/users/${id}`);
        setUsername(response.data.username);
        setRole(response.data.role);
        setFetchingUser(false);
      }
    };
    fetchUser();
  }, [id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!username) newErrors.username = "Username is required.";
    if (!password && !id) newErrors.password = "Password is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userPayload = {
        username,
        password,
        role,
      };

      if (id) {
        try {
          const response = await axiosInstance.put<User>(
            `/users/${id}`,
            userPayload
          );
          Alert.alert("Success", "User updated successfully!");
        } catch (error) {
          console.error("Error updating user:", error);
          throw error;
        }
      } else {
        // Perform the API call to add the user
        await register(userPayload);
        setVisible(true);
        setUsername("");
        setPassword("");
        setRole("waiter");
      }
      router.navigate("/users");
    } catch (error) {
      Alert.alert("Error", "Failed to save user. Please try again.");
      console.error("User save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!id) return;
      setLoading(true);
      await deleteUser(id);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to delete user. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
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
          title={id ? "Edit User" : "Add New User"}
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
        {id && (
          <Appbar.Action icon="delete" color="red" onPress={handleDeleteUser} />
        )}
      </Appbar.Header>
      {fetchingUser ? (
        <ActivityIndicator />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            error={!!errors.username}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            //   secureTextEntry
            style={styles.input}
            mode="outlined"
            error={!!errors.password}
          />

          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <Text style={styles.label}>Role</Text>
          <RadioButton.Group
            onValueChange={(newValue) => setRole(newValue as any)}
            value={role}
          >
            <View style={styles.radioContainer}>
              <RadioButton.Item label="Waiter" value="waiter" />
              <RadioButton.Item label="Manager" value="manager" />
            </View>
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : id ? (
              "Update User"
            ) : (
              "Add User"
            )}
          </Button>
        </ScrollView>
      )}

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={Snackbar.DURATION_SHORT}
        action={{
          label: "Close",
          onPress: () => setVisible(false),
        }}
      >
        User added successfully!
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
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "bold",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default AddUserScreen;
