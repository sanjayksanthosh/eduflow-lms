import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { ApiResponse, TokenResponse } from "@/lib/types"

export const ACCESS_TOKEN_KEY = "eduflow.accessToken"
export const REFRESH_TOKEN_KEY = "eduflow.refreshToken"
export const USER_KEY = "eduflow.user"

export const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api"

export const api = axios.create({
  baseURL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<ApiResponse<TokenResponse>>(
      `${baseURL}/auth/refresh`,
      { refreshToken }
    )
    localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken)
    return data.data.accessToken
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = original?.url ?? ""

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/refresh")
    ) {
      original._retry = true
      refreshing = refreshing ?? refreshAccessToken()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
      clearAuth()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message as string | undefined
    return message ?? error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
