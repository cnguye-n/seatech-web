import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/pages/login.css";

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const { user, loginWithGoogleToken, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id:
          "1070305574453-fmq2q4sitlur2fnmp16qq1enkfg4t0n5.apps.googleusercontent.com",
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      // Cancel any One Tap prompt so only the button shows
      window.google.accounts.id.cancel();
      const target = document.getElementById("googleSignInDiv");
      if (target) {
        target.innerHTML = "";
        window.google.accounts.id.renderButton(target, {
          theme: "outline",
          size: "large",
          width: 300,
          shape: "pill",
        });
      }
    };

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
  }, [user]);

  async function handleGoogleResponse(response: any) {
    const ok = await loginWithGoogleToken(response.credential);
    if (ok) {
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } else {
      alert("Login failed. Please try again.");
    }
  }

  async function handleEmailLogin() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Email login error:", err);
      alert("Server error during login");
    }
  }
  function handleLogout() {
    const email = user?.email;
    logout();
    if (window.google?.accounts?.id && email) {
      window.google.accounts.id.revoke(email, () => {
        console.log("Google session revoked");
      });
    }
  }

  return (
    <div className="login-page">
      {/* LEFT — full bleed photo */}
      <div className="login-photo">
        <img
          src="/images/turtle4goodbackground.jpg"
          alt="Sea turtle swimming underwater"
          className="login-photo-img"
        />
        <div className="login-photo-overlay" />

        {/* wave divider between photo and card */}
        <svg className="login-wave" viewBox="0 0 120 800" preserveAspectRatio="none">
          <path d="M120,0 L120,800 L0,800 C30,700 0,600 40,500 C80,400 10,300 50,200 C90,100 20,50 120,0 Z" fill="white" />
        </svg>

        {/* text over the photo */}
        <div className="login-photo-text">
          <span className="login-photo-logo">SEAtech</span>
          <h2 className="login-photo-headline">Tracking &amp; Protecting<br />Sea Turtles</h2>
          <p className="login-photo-sub">GPS sensor data · Migration mapping · Conservation research</p>
        </div>
      </div>

      {/* RIGHT — login card */}
      <div className="login-side">
        <div className="login-card">
          {!user ? (
            <>
              {/* icon */}
              <div className="login-icon-wrap">
                <svg viewBox="0 0 56 56" className="login-icon">
                  <circle cx="28" cy="28" r="26" fill="none" stroke="#83c5be" strokeWidth="2" />
                  <path d="M18 30 C20 22, 28 18, 36 24 C39 27, 36 34, 28 34 C22 34, 20 32, 18 30Z" fill="#83c5be" opacity="0.5" />
                  <path d="M20 27 C23 20, 30 17, 38 22" fill="none" stroke="#006d77" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              <h1 className="login-title">Welcome back</h1>
              <p className="login-subtitle">Sign in to access your dashboard, upload tracker data, and manage your research team.</p>

              {/* email/password form */}
              <div className="login-form">
                <div className="login-input-group">
                  <label className="login-label" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="login-input-group">
                  <label className="login-label" htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    className="login-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button className="login-submit-btn" type="button" onClick={handleEmailLogin}>
                  Sign in
                </button>
              </div>

              {/* divider */}
              <div className="login-or-divider">
                <span>or continue with</span>
              </div>

              {/* google button */}
              <div id="googleSignInDiv" className="login-google-btn" />

              <div className="login-divider" />

              <p className="login-footer-text">
                Need access? Contact your team administrator.
              </p>
            </>
          ) : (
            <div className="login-profile">
              {user.picture && (
                <img src={user.picture} alt="Profile" className="login-avatar" />
              )}
              <h1 className="login-title">Welcome, {user.name}</h1>
              <p className="login-subtitle" style={{ marginBottom: "0.5rem" }}>{user.email}</p>
              <div className="login-role-badge">{user.role || "viewer"}</div>
              <button className="login-logout-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
        <span className="login-copyright">© {new Date().getFullYear()} SEAtech. All rights reserved.</span>
      </div>
    </div>
  );
}