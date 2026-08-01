import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { PageLoader } from "@/components/shared/PageLoader"
import type { Role } from "@/lib/types"

interface ProtectedRouteProps {
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return <PageLoader className="min-h-screen" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, initializing } = useAuth()
  if (initializing) {
    return <PageLoader className="min-h-screen" />
  }
  if (user) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />
  }
  return <Outlet />
}
