import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Role = "admin" | "member" | "public";

export default function RoleProtectedRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow: Role[];
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role: Role = user?.role ?? "public";
  if (!allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}