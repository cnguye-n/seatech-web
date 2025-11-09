
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const goToIsland = (id: string) => {
    navigate(`/islands#${id}`);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">logo</Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              Home
            </NavLink>
          </li>

          {/* Dropdown */}
          <li className="nav-item dropdown">
            <span className="nav-link nav-link-static">
              Islands <span className="caret">▾</span>
            </span>

            <ul className="dropdown-menu">
              {islands.map((it) => (
                <li key={it.id}>
                  {/* You can use a button for clarity, or NavLink with to={`/islands#${it.id}`} */}
                  <button
                    type="button"
                    className="dropdown-link"
                    onClick={() => goToIsland(it.id)}
                  >
                    {it.label}
                  </button>
                  {/* Alternative (also works):
                  <NavLink to={`/islands#${it.id}`} className="dropdown-link">
                    {it.label}
                  </NavLink>
                  */}
                </li>
              ))}
            </ul>
          </li>

          <li className="nav-item">
            <NavLink to="/sensor" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              Sensor
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/about" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              About
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to="/login" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
              Login
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
