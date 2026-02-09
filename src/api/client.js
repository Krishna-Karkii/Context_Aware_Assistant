import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API] Added token to request header");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log("[API] Received 401 - clearing token and redirecting to login");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const signupUser = async (firstName, lastName, email, password) => {
  try {
    console.log(`[API] Signing up user: ${email}`);
    const response = await apiClient.post("/auth/signup", {
      firstName,
      lastName,
      email,
      password,
    });
    console.log("[API] Signup successful");
    return response.data;
  } catch (error) {
    console.error("[API] Signup failed:", error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log(`[API] Logging in user: ${email}`);
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    console.log("[API] Login successful");
    return response.data;
  } catch (error) {
    console.error("[API] Login failed:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit a research query to the backend.
 * 
 * @param {string} query - The research question
 * 
 * @returns {Promise<{response: string, citations: Array}>}
 *          Response with AI answer and citations
 * 
 * @throws {AxiosError} If server error or authentication fails
 * 
 * Example:
 *   >>> const result = await submitQuery("What is RAG?");
 *   >>> console.log(result.response);
 *   >>> console.log(result.citations);
 */
export const submitQuery = async (query) => {
  try {
    console.log("[API] Submitting query:", query);
    
    const response = await apiClient.post("/research/query", {
      query,
    });
    
    console.log("[API] Query response received");
    return response.data;
    
  } catch (error) {
    console.error("[API] Query failed:", error.response?.data || error.message);
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  return !!token;
};

export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const logout = () => {
  console.log("[API] Logging out user");
  localStorage.removeItem("access_token");
  window.location.href = "/login";
};

export default apiClient;