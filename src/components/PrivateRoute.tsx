import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-5 w-5 mr-3" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
