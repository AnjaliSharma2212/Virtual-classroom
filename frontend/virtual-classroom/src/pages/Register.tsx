import { useState } from "react";
import { registerUser } from "../api/registerApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: "student" | "teacher" | "";
  }>({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.role) {
      setError("Please select a role.");
      return;
    }

    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role, // role is now strictly typed
      });
      toast.success("Registration successfull.");
      navigate("/login");
    } catch (err) {
      setError("Registration failed.");
      toast.error("Registration failed.");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 bg-blue-100 m-4 rounded shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center text-blue-600">
        Register
      </h2>
      {error && <p className="text-red-500">{error}</p>}

      <input
        className="border rounded p-2 w-full mb-2 text-black"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="border rounded p-2 w-full mb-2"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        className="border rounded p-2 w-full mb-2"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <select
        className="border rounded p-2 w-full mb-4 text-black"
        value={form.role}
        onChange={(e) =>
          setForm({
            ...form,
            role: e.target.value as "student" | "teacher" | "",
          })
        }
      >
        <option value="">Select Role</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white w-full p-2 rounded"
      >
        Register
      </button>
      <p className="m-2 m-1 text-black">
        Already have an account?{" "}
        <a href="/login" className="text-blue-500 m-1">
          Login here
        </a>
      </p>
    </div>
  );
};

export default RegisterPage;
