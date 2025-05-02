import { COLORS } from "@/constants/ColorPallet";
import { StyleSheet, Text, View, Image } from "react-native";
import appJson from '../../../app.json';

export default function SplashScreen() {
  const logo = require('../../../assets/logo/logo.png');

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image
          style={styles.logo}
          source={logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.bottom}>
        <Text>Version: {appJson.expo.version}</Text>
        <Text>From: OceanGate</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.mainBackground
  },
  logoWrapper: {
    // Optional: add animation if you want
  },
  logo: {
    height: 400,
    width: 300
  },
  bottom: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20
  }
});
