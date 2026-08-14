import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { capitalize, fullName, getInitials } from "@/lib/format"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          {user.profileImage ? (
            <AvatarImage
              src={user.profileImage}
              alt={fullName(user.firstName, user.lastName)}
            />
          ) : null}
          <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start text-left sm:flex">
          <span className="truncate text-sm font-medium">
            {fullName(user.firstName, user.lastName)}
          </span>
          <span className="text-xs text-muted-foreground">{capitalize(user.role)}</span>
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut /> Log out
      </Button>
    </div>
  )
}
