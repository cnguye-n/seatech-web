import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../auth/AuthContext";
import './Navbar.css';

const islands = [
  { label: 'Isla Menor Cayo Roncador', id: "island-1" },
  { label: 'Isla Providencia y Santa Catalina', id: "island-2" },
  { label: 'Isla Menor Cayo Serrana', id: "island-3" },
  { label: 'Isla Menor Cayo Serranilla', id: "island-4" },
  { label: 'Isla Menor Cayo Bolivar', id: "island-5" },
  { label: 'Isla Menor Cayo Albuquerque', id: "island-6" },
];

export default function Navbar() {

  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const goToIsland = (id: string) => {
    navigate(`/islands#${id}`);
  };

  const handleLogoutClick = () => {
    logout();
    navigate("/"); // send them home after logout if you want
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">SEAtech</Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Home
            </NavLink>
          </li>

          {/* dropdown */}
          <li className="nav-item dropdown">
            <span className="nav-link nav-link-static">
              Islands <span className="caret">▾</span>
            </span>

            <ul className="dropdown-menu">
              {islands.map((it) => (
                <li key={it.id}>
                  <button type="button" className="dropdown-link" onClick={() => goToIsland(it.id)}>
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          </li>

          <li className="nav-item">
            <NavLink to="/sensor" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Sensor
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              About
            </NavLink>
          </li>

          {isAuthenticated && (
            <li className="nav-item">
              <NavLink
                to="/manage"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Manage
              </NavLink>
            </li>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <li className="nav-item">
              <NavLink
                to="/admin/access"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Admin
              </NavLink>
            </li>
          )}

          {!isAuthenticated ? (
            <li className="nav-item">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Login
              </NavLink>
            </li>
          ) : (
            <li className="nav-item dropdown">
              <span className="nav-link nav-link-static">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt="Profile"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      border: "2px solid white"
                    }}
                  />
                )}
                {user?.name ? user.name.split(" ")[0] : "User"}
                <span className="caret">▾</span>
              </span>

              <ul className="dropdown-menu">
                <li>
                  <button
                    type="button"
                    className="dropdown-link"
                    onClick={() => navigate("/settings")}
                  >
                    ⚙️ Settings
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-link"
                    onClick={handleLogoutClick}
                  >
                    Log Out
                  </button>
                </li>
              </ul>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}