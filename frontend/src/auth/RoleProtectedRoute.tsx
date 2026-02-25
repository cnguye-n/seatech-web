import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Role = "admin" | "member" | "viewer";

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

  
  const role: Role =
    user?.role === "admin" || user?.role === "member"
      ? user.role
      : "viewer";

  if (!allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
