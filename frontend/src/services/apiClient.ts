import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url ?? "");
    const isLoginRequest = url.includes("/auth/login");
    const onLoginPage = window.location.pathname === "/login";

    if (status === 401 && !isLoginRequest && !onLoginPage) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
