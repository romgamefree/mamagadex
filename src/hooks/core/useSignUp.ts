import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { auth } from '@/api/core/auth';
import { Constants } from '@/constants';

export type SignUpFormData = {
  email: string;
  password: string;
  name: string;
  'cf-turnstile-response': string;
};

export const useSignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const signUp = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);
      await auth.signUp(data);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
      router.push(Constants.Routes.login);
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error);
      let message = 'Đã có lỗi xảy ra khi đăng ký';
      if (error.message) {
        message = error.message;
      }
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    isLoading
  };
};