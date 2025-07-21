import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface UserProfile {
  name: string;
  avatarUrl: string;
  bio: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const userId = localStorage.getItem("userId"); // Assuming you store this at login
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}api/profile/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="p-4 text-center text-red-600">User not logged in.</div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center text-gray-500">Loading profile...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-100 via-white to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
        <img
          src={
            profile.avatarUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`
          }
          alt="User Avatar"
          className="w-32 h-32 rounded-full border-4 border-indigo-400 shadow-lg mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {profile.name}
        </h1>
        <p className="text-gray-600 mb-4">{profile.bio}</p>

        <button
          onClick={() => toast.success("Edit Profile Coming Soon!")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-full transition duration-300 shadow-md hover:scale-105"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
