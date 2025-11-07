import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const islands = [
  { label: 'Isla Menor Cayo Roncador', to: '/islands/roncador' },
  { label: 'Isla Providencia y Santa Catalina', to: '/islands/providencia' },
  { label: 'Isla Menor Cayo Serrana', to: '/islands/serrana' },
  { label: 'Isla Menor Cayo Serranilla', to: '/islands/serranilla' },
  { label: 'Isla Menor Cayo Bolivar', to: '/islands/bolivar' },
  { label: 'Isla Menor Cayo Albuquerque', to: '/islands/albuquerque' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <a href="/" className="nav-logo">logo</a>

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
                <li key={it.to}>
                  <NavLink to={it.to} className="dropdown-link">
                    {it.label}
                  </NavLink>
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
