import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toast } from "sonner";

// 创建实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000,
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || import.meta.env.VITE_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === "00000" || res.code === 200 || res.success === true) {
      return res.result ?? res.data;
    }
    if (res.code === "A0001") {
      toast.error("Token无效");
      return Promise.reject(new Error("Token无效"));
    } else {
      toast.error(res.message || "请求出错");
      return Promise.reject(res);
    }
  },
  (error) => {
    toast.error(error.message || "请求出错");
    return Promise.reject(error);
  }
);

// 扩展axios实例，添加泛型支持
interface ExtendedAxiosInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T>;
  request<T = any>(config: AxiosRequestConfig): Promise<T>;
}

export default instance as ExtendedAxiosInstance;
