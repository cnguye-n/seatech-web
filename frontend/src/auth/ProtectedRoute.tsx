import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}