export type AuthStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPasswordOtpVefication: { email: string };
  SetNewPassword: { email: string; resetToken: string };
  VerifyOtp: { username: string; email: string };
};
