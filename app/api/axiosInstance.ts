import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log("[axios] BASE_URL =", BASE_URL); // ← 임시로그
// 기본 axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 30초 제한
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
