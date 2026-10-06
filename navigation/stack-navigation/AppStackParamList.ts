import type { NavigatorScreenParams } from '@react-navigation/native';
import type { HomeTabParamList } from '../tab-navigation/HomeBottomTabNavigation';

export type RootStackParamList = {
  Process: NavigatorScreenParams<HomeTabParamList> | undefined;
  SOSSCREEN: undefined;
  UserListScreen: undefined;
  ChatScreen: {
    otherUserId: string;
    otherUserName?: string;
  };
};
