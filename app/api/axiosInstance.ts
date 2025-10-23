import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 기본 axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10초 제한
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
