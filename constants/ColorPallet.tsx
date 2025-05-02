/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const COLORS = {
  primary: "#FF1414",
  secondary: "#00FF00",
  tertiary: "#0000FF",
  background: "#FFFFFF",
  mainBackground: "#0456C7",
  mainBackgroundtwo: "#F2F2F2",
  primaryBlack: "#000000",
  darkGray: "#333333",
  lightGray: "#CCCCCC",
  lighBlue: "#00BFFF",
  lightGray2: "#F2F2F2",
  gray: "#808080",
  primaryTextColor:"#FFFFFF",
  primaryGray:"#D9D9D9",
  primaryTextBlueColor: "#0456C7"
} as const;

export type ColorPallet = keyof typeof COLORS;