import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "1070305574453-fmq2q4sitlur2fnmp16qq1enkfg4t0n5.apps.googleusercontent.com", // This is tied to my personal account, it probably shouldn't be LOL
          callback: handleGoogleResponse,
        });

        // Render Google button automatically
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", width: 260 }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = (response: any) => {
    console.log("Google credential:", response.credential);

    // You can decode the JWT token to get user info:
    localStorage.setItem("google_credential", response.credential);
    const userObject = parseJwt(response.credential);
    setUser(userObject);
  };

  useEffect(() => {
  const storedToken = localStorage.getItem("google_credential");
  if (!storedToken) return;

  const userObject = parseJwt(storedToken);
  if (userObject) {
    setUser(userObject);
  } else {
    // token is broken/expired → clean it up
    localStorage.removeItem("google_credential");
  }
}, []);


  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

const handleLogout = () => {
  setUser(null);
  localStorage.removeItem("google_credential");

  // Optional: revoke Google session if you want to fully sign out:
  if (window.google?.accounts?.id && user?.email) {
    window.google.accounts.id.revoke(user.email, () => {
      console.log("Google session revoked");
    });
  }
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Logging in as: ${username}`);
  };

  // Show logged-in user info or login UI
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {!user ? (
          <>
            <h1 style={styles.title}>Login</h1>
                  <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          </div>
          <button type="submit" style={styles.button}>
            Log In
          </button>
        </form>
            <div id="googleSignInDiv" style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}></div>
          </>
        ) : (
          <>
            <h1 style={styles.title}>Welcome, {user.name}</h1>
            <img
              src={user.picture}
              alt="Profile"
              style={{ borderRadius: "50%", width: "80px", margin: "1rem 0" }}
            />
            <p style={styles.subtitle}>{user.email}</p>
            <button style={styles.button} onClick={handleLogout}>
              Log out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
     page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #7aa2ff, #6cf3d6)",
    fontFamily: "Segoe UI, Roboto, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2rem 3rem",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    textAlign: "center",
    maxWidth: "360px",
    width: "100%",
  },
  title: { marginBottom: "0.5rem", color: "#1b2333" },
  subtitle: { marginBottom: "1.5rem", color: "#555" },
  button: {
    padding: "0.75rem 1.25rem",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#7aa2ff",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem",
  },
};
