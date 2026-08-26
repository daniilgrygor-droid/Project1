import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/authContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!configured) {
    return <Navigate to="/auth" replace />;
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (!profile || !profile.onboarded_at) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
