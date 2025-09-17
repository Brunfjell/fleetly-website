import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "../../components/Footer";

export default function Login() {
  const { login, loginError, setLoginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const user = await login(email, password);

    if (user && user.id) {
      navigate(from, { replace: true });
    }

    setLoading(false);
  };

  return (
    <>
      <div
        className="hero min-h-screen"
        style={{ backgroundImage: "url(/fleetly-website/Login-BG.png)" }}
      >
        <div className="hero-overlay"></div>

        <div className="hero-content flex-col lg:flex-row gap-7">
          <div className="flex flex-col items-center lg:items-end text-neutral-content max-w-md text-center lg:text-right">
            <img
              src="/fleetly-website/icon.png"
              alt="Fleetly Logo"
              className="h-20 w-20 mb-4"
            />
            <h1 className="text-5xl font-bold">Fleetly</h1>
            <p className="py-6">
              Sign in to access your account, track vehicle usage, monitor
              trips, and stay on top of company operations.
            </p>
          </div>

          <div className="card w-full max-w-sm shadow-2xl bg-neutral-700">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h1 className="text-xl font-bold text-center text-white">
                  Login to Your Account
                </h1>

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div className="flex justify-between text-sm">
                  <a href="#" className="link link-hover text-white">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {loginError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
            <h2 className="text-lg font-bold mb-2">Login Error</h2>
            <p className="mb-4">{loginError}</p>
            <button
              className="btn btn-sm btn-error"
              onClick={() => setLoginError(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
