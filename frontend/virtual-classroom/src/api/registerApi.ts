import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL", API_URL);
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
}) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  console.log("API_URL", API_URL);
  const response = await axios.post(`${API_URL}/api/auth/login`, credentials);

  return response.data;
};
