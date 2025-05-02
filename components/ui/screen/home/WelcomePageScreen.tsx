import React from "react";
import { Text, View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/ColorPallet";

export default function WelcomePageScreen({navigation}:any) {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/Ellipse 1.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.header}>Safe Navigation </Text>
      <Text style={styles.header}>Ensure Sustainability </Text>
      <Text style={styles.description}>
        OceanPulse is a smart navigation system for mariners. It provides
        real-time weather updates, emergency SOS features, and route planning
      </Text>

      <View style={styles.btnContainer}>
      <TouchableOpacity style={{ ...styles.btn, backgroundColor: "#0456C7" }}
      onPress={() => navigation.navigate("Login")}
      >
        <Text style={{ color: COLORS.background }}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ ...styles.btn, backgroundColor:COLORS.gray }}
      onPress={() => navigation.navigate("Signup")}
      >
        <Text style={{ color: COLORS.background }}>Sign Up</Text>
      </TouchableOpacity>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
    btnContainer:{
        flexDirection: "row",
        gap:20
    },
    btn: {
    backgroundColor: "#0456C7",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 10,

  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
