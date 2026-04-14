import { axiosInstance } from "@/api/axiosInstance";
import type { LoginResponse, LoginSuccessResponse } from "@/types";

export interface LoginInput {
  username: string;
  password: string;
}

export interface VerifyOtpInput {
  username: string;
  otp: string;
}

export async function loginApi(payload: LoginInput): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>("/auth/login/", payload);
  return data;
}

export async function verifyOtpApi(payload: VerifyOtpInput): Promise<LoginSuccessResponse> {
  const { data } = await axiosInstance.post<LoginSuccessResponse>("/auth/verify-otp/", payload);
  return data;
}

export async function resendOtpApi(username: string): Promise<{ detail: string }> {
  const { data } = await axiosInstance.post<{ detail: string }>("/auth/resend-otp/", { username });
  return data;
}