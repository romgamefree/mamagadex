import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "nextjs-toploader/app";
import { User } from "@supabase/supabase-js";

import { auth } from "@/api/core/auth";
import { supabase } from "@/api/core/supabase";
import { Constants } from "@/constants";
import { useState } from "react";

export const useAuth = ({
  middleware,
  redirectIfAuthenticated,
  redirectIfNotAuthenticated,
}: {
  middleware?: string;
  redirectIfAuthenticated?: string;
  redirectIfNotAuthenticated?: string;
} = {}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initial user fetch
    auth
      .getUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null));

    // Set up realtime subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (props: {
    email: string;
    password: string;
    name: string;
    password_confirmation: string;
    "cf-turnstile-response": string;
  }) => {
    await auth.signUp(props);
    toast("Đăng ký thành công");
  };

  const login = async (props: {
    email: string;
    password: string;
    remember: boolean;
    "cf-turnstile-response": string;
  }) => {
    await auth.login(props);
    toast("Đăng nhập thành công");
  };

  const forgotPassword = async (data: {
    email: string;
    "cf-turnstile-response": string;
  }) => {
    await auth.forgotPassword(data);
    toast("Đã gửi email khôi phục mật khẩu");
  };

  const resetPassword = async (props: {
    email: string;
    password: string;
    password_confirmation: string;
    token: string;
  }) => {
    await auth.resetPassword(props);
    toast("Đổi mật khẩu thành công");
    router.push(Constants.Routes.login);
  };

  const resendEmailVerification = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("User not found");

    await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });
    toast("Đã gửi lại email xác thực");
  };

  const logout = useCallback(async () => {
    await auth.logout();
    toast("Đăng xuất thành công");
  }, []);

  const changePassword = useCallback(
    async (data: {
      oldPassword: string;
      password: string;
      confirmPassword: string;
    }) => {
      await auth.changePassword({
        current_password: data.oldPassword,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });
      toast("Đổi mật khẩu thành công");
    },
    [],
  );

  useEffect(() => {
    if (middleware === "guest" && user) {
      console.log(
        middleware,
        user,
        redirectIfAuthenticated,
        redirectIfNotAuthenticated,
      );
      // debugger;
      toast("Đã đăng nhập, chuyển hướng...");
      router.push(redirectIfAuthenticated || Constants.Routes.nettrom.index);
    }

    if (middleware === "auth" && user === null) {
      router.push(redirectIfNotAuthenticated || Constants.Routes.login);
    }
  }, [!!user, middleware, redirectIfAuthenticated, redirectIfNotAuthenticated]);

  return {
    user,
    signup,
    login,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
    logout,
    changePassword,
  };
};
