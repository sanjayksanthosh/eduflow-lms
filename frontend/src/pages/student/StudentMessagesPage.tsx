import { useEffect, useRef, useState } from "react"
import { MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { fullName, getInitials, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
    profileImage: string | null
  }
}

export function StudentMessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get("/student/messages")
      setMessages(data.data as Message[])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const { data } = await api.post("/student/messages", { content: content.trim() })
      setMessages((prev) => [...prev, data.data as Message])
      setContent("")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  if (loading && messages.length === 0) return <PageLoader />
  if (error && messages.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Messages" description="Chat with your mentor." />
        <ErrorState message={error} onRetry={load} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <PageHeader title="Messages" description="Chat with your mentor and classmates." />
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border bg-card p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Messages from your mentor will appear here."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === user?.id
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-3", isOwn && "flex-row-reverse")}
                >
                  <Avatar size="sm">
                    <AvatarImage
                      src={message.sender.profileImage ?? undefined}
                      alt={fullName(message.sender.firstName, message.sender.lastName)}
                    />
                    <AvatarFallback>
                      {getInitials(message.sender.firstName, message.sender.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[70%] space-y-1", isOwn && "text-right")}>
                    <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
                      <span className="text-xs font-medium">
                        {fullName(message.sender.firstName, message.sender.lastName)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {message.sender.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(message.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          rows={1}
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-10 resize-none"
        />
        <Button
          size="icon"
          disabled={!content.trim() || sending}
          onClick={() => void send()}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
