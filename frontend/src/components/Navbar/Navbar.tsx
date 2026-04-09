import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [islandsOpen, setIslandsOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  const isAdmin = user?.role === "admin";
  const canSeeSensor = user?.role === "admin" || user?.role === "member";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIslandsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIslandsOpen(false);
  }, [location.pathname]);

  const islands = [
    "Isla Providencia y Santa Catalina",
    "Isla Menor Cayo Serrana",
    "Isla Menor Cayo Serranilla",
    "Isla Menor Cayo Bolívar",
    "Isla Menor Cayo Roncador",
    "Isla San Andrés",
  ];

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          SEAtech
        </Link>

        <ul className="nav-menu">
          <li>
            <Link to="/" className={`nav-link${location.pathname === "/" ? " active" : ""}`}>
              Home
            </Link>
          </li>

          <li className="dropdown" ref={dropdownRef}>
            <button
              className={`nav-link nav-link-button${location.pathname.startsWith("/islands") ? " active" : ""}`}
              onClick={() => setIslandsOpen((v) => !v)}
            >
              Islands <span className="caret">▾</span>
            </button>
            {islandsOpen && (
              <ul className="dropdown-menu">
                {islands.map((name) => (
                  <li key={name}>
                    <Link
                      to={`/islands?name=${encodeURIComponent(name)}`}
                      className="dropdown-link"
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Sensor — admin + member */}
          {user && canSeeSensor && (
            <li>
              <Link to="/sensor" className={`nav-link${location.pathname === "/sensor" ? " active" : ""}`}>
                Sensor
              </Link>
            </li>
          )}

          <li>
            <Link to="/about" className={`nav-link${location.pathname === "/about" ? " active" : ""}`}>
              About
            </Link>
          </li>

          {/* Admin-only links */}
          {user && isAdmin && (
            <>
              <li>
                <Link to="/manage" className={`nav-link${location.pathname === "/manage" ? " active" : ""}`}>
                  Manage
                </Link>
              </li>
              <li>
                <Link to="/admin/access" className={`nav-link${location.pathname === "/admin/access" ? " active" : ""}`}>
                  Admin
                </Link>
              </li>
            </>
          )}

          <li>
            <Link to="/login" className={`nav-link${location.pathname === "/login" ? " active" : ""}`}>
              {user ? "Account" : "Login"}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}