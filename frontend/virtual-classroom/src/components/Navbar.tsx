import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import ConfirmModal from "./ConfirmWindow";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { role, logout, userProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const baseButtonClass =
    "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full shadow-md transform hover:scale-105 transition-all duration-300";

  const renderRoleButtons = () => {
    if (role === "teacher") {
      return (
        <button
          onClick={() => navigate("/teacher-dashboard")}
          className={baseButtonClass}
        >
          Teacher Dashboard
        </button>
      );
    }
    if (role === "student") {
      return (
        <button
          onClick={() => navigate("/student-dashboard")}
          className={baseButtonClass}
        >
          Student Dashboard
        </button>
      );
    }
    return null;
  };

  return (
    <>
      <nav
        className={`w-full sticky p-5 top-0 left-0 z-50 flex flex-wrap justify-between items-center px-6 py-4 backdrop-blur-lg bg-white/30 dark:bg-gray-900/50 shadow-lg ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        <h1
          className="font-bold text-lg sm:text-xl tracking-wide cursor-pointer hover:scale-105 transition"
          onClick={() => navigate("/")}
        >
          Virtual Classroom 🚀
        </h1>

        <div className="flex items-center flex-wrap gap-3 justify-center mt-3 sm:mt-0">
          {renderRoleButtons()}
          {userProfile && (
            <div
              onClick={() => navigate("/profile")}
              className="flex items-center cursor-pointer hover:scale-105 transition"
            >
              <img
                src={
                  userProfile.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile.name}`
                }
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-white shadow"
              />
              <span className="ml-2 font-medium hidden sm:block">
                {userProfile.name}
              </span>
            </div>
          )}
          {role ? (
            <>
              <button
                onClick={() => navigate("/chats")}
                className={baseButtonClass}
              >
                Chit Chat
              </button>
              <button
                onClick={() => navigate("/notes")}
                className={baseButtonClass}
              >
                Notes
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full shadow-md transform hover:scale-105 transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className={baseButtonClass}
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className={baseButtonClass}
              >
                Register
              </button>
            </>
          )}

          <button
            onClick={toggleDarkMode}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-full shadow-md transform hover:scale-110 transition-all duration-300"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      {showLogoutModal && (
        <ConfirmModal
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

export default Navbar;
