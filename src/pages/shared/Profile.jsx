import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/api";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(user.id, profile);
    setLoading(false);
    alert("Profile updated!");
  };

  if (!profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <input
          type="text"
          name="name"
          value={profile.name || ""}
          onChange={handleChange}
          placeholder="Full Name"
          className="input input-bordered w-full"
        />
        <input
          type="text"
          name="phone"
          value={profile.phone || ""}
          onChange={handleChange}
          placeholder="Phone Number"
          className="input input-bordered w-full"
        />
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
