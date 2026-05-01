import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);


export const signupUser = async (firstName, lastName, email, password) => {
  const res = await apiClient.post("/auth/signup", { firstName, lastName, email, password });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data;
};

export const submitQuery = async (query, threadId = null) => {
  const body = { query };
  if (threadId) body.thread_id = threadId;
  const res = await apiClient.post("/research/query", body);
  return res.data;
};

export const getThreads = async () => {
  const res = await apiClient.get("/research/threads");
  return res.data; 
};


export const getThread = async (threadId) => {
  const res = await apiClient.get(`/research/threads/${threadId}`);
  return res.data;
};


export const isAuthenticated = () => !!localStorage.getItem("access_token");

export const logout = () => {
  localStorage.removeItem("access_token");
  window.location.href = "/";
};

export default apiClient;