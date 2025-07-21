import { useState } from "react";
import { loginUser } from "../api/registerApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, fetchUserProfile } = useAuth();

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form);

      localStorage.setItem("token", res.token); // store JWT
      localStorage.setItem("role", res.role); // store role
      localStorage.setItem("userId", res.id);
      localStorage.setItem("name", res.name);
      console.log(localStorage.getItem(res.name));

      login(res.role);
      await fetchUserProfile();

      // Redirect based on role
      if (res.role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (res.role === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 mt-10 shadow-lg rounded bg-blue-100 m-5">
      <h2 className="text-lg font-bold mb-4 text-center text-blue-700">
        Login
      </h2>
      {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

      <input
        type="email"
        className="border rounded p-2 w-full mb-2 text-black"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        className="border rounded p-2 w-full mb-4 text-black"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`flex justify-center items-center ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
        } text-white w-full p-2 rounded`}
      >
        {loading ? <span className="loader"></span> : "Login"}
      </button>

      <p className="text-black text-italic">
        Don't have any account?{" "}
        <a href="/register" className="text-blue-500">
          Register Here
        </a>
      </p>
      {/* Simple CSS Spinner */}
      <style>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #ffffff;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
