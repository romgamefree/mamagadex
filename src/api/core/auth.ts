import { supabase } from "./supabase";
import { Constants } from "@/constants";

export type SignUpData = {
  email: string;
  password: string;
  name: string;
  "cf-turnstile-response": string;
};

export type LoginData = {
  email: string;
  password: string;
  remember: boolean;
  "cf-turnstile-response": string;
};

export type PasswordResetData = {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
};

export const auth = {
  getUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  signUp: async ({ email, password, name }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return data;
  },

  login: async ({ email, password }: LoginData) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async ({ password }: PasswordResetData) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
    return data;
  },

  forgotPassword: async ({ email }: { email: string }) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${Constants.APP_URL}/password-reset`,
    });
    if (error) throw error;
    return data;
  },

  changePassword: async ({
    current_password,
    password,
  }: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    // First verify the old password
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("User not found");

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (verifyError) throw new Error("Current password is incorrect");

    // Then update to the new password
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return data;
  },
};
