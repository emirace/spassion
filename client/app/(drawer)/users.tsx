import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { Appbar, List, useTheme, Text, IconButton } from "react-native-paper";
import { useAuth } from "@/contexts/Auth";
import axiosInstance from "@/servers/api";
import { User } from "@/types/user";
import { DrawerToggleButton } from "@react-navigation/drawer";

const Users = () => {
  const { users, fetchUsers } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const { colors } = useTheme();

  useEffect(() => {
    const handlefetchUsers = async () => {
      try {
        await fetchUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    // if (user) {
    handlefetchUsers();
    // }
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator animating={true} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header
        mode="small"
        style={{ backgroundColor: colors.elevation.level1 }}
      >
        <DrawerToggleButton tintColor={colors.onBackground} />
        <Appbar.Content
          title="User "
          titleStyle={{ fontSize: 24, fontWeight: "600" }}
        />
        <Appbar.Action icon={"plus"} onPress={() => router.push("/adduser")} />
      </Appbar.Header>
      <View style={{ padding: 20, flex: 1 }}>
        {users.length > 0 ? (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <List.Item
                title={item.username}
                //   description={item.email}
                right={() => (
                  <IconButton
                    icon={"pen"}
                    iconColor={colors.onBackground}
                    onPress={() =>
                      router.push({
                        pathname: "/adduser",
                        params: { id: item._id },
                      })
                    }
                  />
                )}
                style={[
                  styles.listItem,
                  { borderBottomColor: colors.onBackground },
                ]}
              />
            )}
          />
        ) : (
          <View style={{ alignItems: "center", padding: 50 }}>
            <Text>No users</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Users;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    // borderWidth: 1,
  },
});
