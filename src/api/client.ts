import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

const options = {
  baseURL: `${import.meta.env.VITE_API_URL}`,
  withCredentials: true,
};

export const queryClient = new QueryClient();

const API = axios.create(options);

const refreshToken = async () => {
  const refreshTokenClient = axios.create(options);
  const res = await refreshTokenClient.get("/auth/refresh");
  return res.data;
};

API.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const { config, response } = error;
    const { status, data } = response || {};

    if (status === 401 && data?.errorCode === "InvalidAccessToken") {
      try {
        await refreshToken();
        return API(config); //Retry original request using original configuration
      } catch (error) {
        queryClient.clear();
        const redirectUrl = window.location.pathname;
        sessionStorage.setItem("redirectUrl", redirectUrl);
        window.location.href = "/login";
      }
    }
    return Promise.reject({ status, data });
  }
);

export default API;
