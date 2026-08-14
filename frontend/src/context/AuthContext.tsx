import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, clearAuth, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "@/lib/api"
import type { AuthResponse, User } from "@/lib/types"

interface AuthContextValue {
  user: User | null
  initializing: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  })
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem(USER_KEY)) {
      setInitializing(false)
      return
    }
    api
      .get("/auth/me")
      .then((res) => {
        const current = res.data.data as User
        setUser(current)
        localStorage.setItem(USER_KEY, JSON.stringify(current))
      })
      .catch(() => {
        clearAuth()
        setUser(null)
      })
      .finally(() => setInitializing(false))
  }, [])

  const login = useCallback(async (identifier: string, password: string, rememberMe?: boolean) => {
    const { data } = await api.post("/auth/login", { identifier, password, rememberMe })
    const payload = data.data as AuthResponse
    localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    setUser(payload.user)
    return payload.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignore network errors during logout
    }
    clearAuth()
    setUser(null)
  }, [])

  const updateUser = useCallback((next: User) => {
    setUser(next)
    localStorage.setItem(USER_KEY, JSON.stringify(next))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser,
    }),
    [user, initializing, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
