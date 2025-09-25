import { useAuth } from "@/hooks/useAuth";
import type { UserContextType } from "@/types";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const { user, isLoading } = useAuth();

  return isLoading ? (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin h-5 w-5 mr-3" />
    </div>
  ) : user ? (
    <Outlet context={{ user } satisfies UserContextType} />
  ) : (
    <Navigate to="/login" replace />
  );
}
