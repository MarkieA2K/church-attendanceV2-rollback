import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./useUser"; // Hook for user authentication state
import Spinner from "../components/Spinner";
import RestrictedAccess from "./RestrictedAccess"; // Component for restricted access

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  userData,
}) {
  const navigate = useNavigate();
  // Load the authenticated user
  const { isLoading, isAuthenticated } = useUser();

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate("/"); // Redirect to login if not authenticated
      } else {
        const userRole = userData?.user_role;
        const roleIsAllowed =
          allowedRoles.length === 0 || allowedRoles.includes(userRole);

        if (!roleIsAllowed) {
          navigate("/restricted-access"); // Redirect to RestrictedAccess if role is not allowed
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate, userData, allowedRoles]);

  // While loading
  if (isLoading) return <Spinner />;

  // Render children if authenticated and role is allowed (or unrestricted)
  return isAuthenticated &&
    (allowedRoles.length === 0 || allowedRoles.includes(userData?.user_role))
    ? children
    : null;
}
