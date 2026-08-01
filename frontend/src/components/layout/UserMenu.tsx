import { useNavigate } from "react-router-dom"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { capitalize, fullName, getInitials } from "@/lib/format"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const rolePath = `/${user.role.toLowerCase()}`

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-1.5">
            <Avatar size="sm">
              {user.profileImage ? (
                <AvatarImage
                  src={user.profileImage}
                  alt={fullName(user.firstName, user.lastName)}
                />
              ) : null}
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="truncate text-sm font-medium">
                {fullName(user.firstName, user.lastName)}
              </span>
              <span className="text-xs text-muted-foreground">{capitalize(user.role)}</span>
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`${rolePath}/profile`)}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
