import { useEffect, useRef, useState } from "react"
import { MessageSquare, Send, User } from "lucide-react"
import { toast } from "sonner"
import { api, getErrorMessage } from "@/lib/api"
import { PageHeader } from "@/components/shared/PageHeader"
import { PageLoader } from "@/components/shared/PageLoader"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fullName, getInitials, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

interface MentorBatchSummary {
  id: string
  name: string
  code: string
}

interface BatchStudent {
  id: string
  userId: string
  user: { firstName: string; lastName: string; email: string; profileImage: string | null }
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  recipientId: string | null
  sender: { id: string; firstName: string; lastName: string; role: string; profileImage: string | null }
}

export function MentorMessagesPage() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<MentorBatchSummary[]>([])
  const [batchId, setBatchId] = useState("")
  const [students, setStudents] = useState<BatchStudent[]>([])
  const [recipientId, setRecipientId] = useState("all")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api
      .get("/mentor/batches")
      .then(({ data }) => setBatches((data.data as MentorBatchSummary[]) ?? []))
      .catch(() => setBatches([]))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/mentor/batches/${id}/messages`)
      setMessages((data.data as ChatMessage[]) ?? [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async (id: string) => {
    if (!id) return
    try {
      const { data } = await api.get(`/mentor/batches/${id}`)
      setStudents(((data.data as { students: BatchStudent[] })?.students ?? []))
    } catch {
      setStudents([])
    }
  }

  const handleBatchChange = (value: string) => {
    setBatchId(value)
    setRecipientId("all")
    setMessages([])
    void loadMessages(value)
    void loadStudents(value)
  }

  const sendMessage = async () => {
    if (!batchId || !content.trim()) return
    setSending(true)
    try {
      await api.post(`/mentor/batches/${batchId}/messages`, {
        content: content.trim(),
        recipientId: recipientId === "all" ? undefined : recipientId,
      })
      setContent("")
      void loadMessages(batchId)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const selectedStudent = students.find((s) => s.userId === recipientId)

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Chat with your batch students." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="batch">Batch</Label>
          <Select value={batchId} onValueChange={(v) => handleBatchChange(v ?? "")}>
            <SelectTrigger id="batch" className="w-64">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {batchId && students.length > 0 ? (
          <div className="grid gap-2">
            <Label>Send to</Label>
            <Select value={recipientId} onValueChange={(v) => setRecipientId(v ?? "all")}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-3.5" />
                    Everyone in batch
                  </div>
                </SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.userId} value={s.userId}>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5" />
                      {fullName(s.user.firstName, s.user.lastName)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {error && messages.length === 0 ? (
        <ErrorState message={error} onRetry={() => batchId && loadMessages(batchId)} />
      ) : null}

      {loading && messages.length === 0 ? <PageLoader /> : null}

      {!batchId ? (
        <EmptyState
          icon={MessageSquare}
          title="Select a batch"
          description="Choose a batch to start a conversation."
        />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages"
          description="Start the conversation with your students."
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => {
                const isMine = message.sender.id === user?.id
                const isPrivate = message.recipientId !== null
                return (
                  <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg border p-3",
                        isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {!isMine ? (
                        <div className="mb-1 flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={message.sender.profileImage ?? undefined} />
                            <AvatarFallback>{getInitials(message.sender.firstName, message.sender.lastName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium opacity-80">
                            {fullName(message.sender.firstName, message.sender.lastName)}
                          </span>
                        </div>
                      ) : null}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className={cn("text-xs", isMine ? "opacity-70" : "text-muted-foreground")}>
                          {timeAgo(message.createdAt)}
                        </p>
                        {isPrivate ? (
                          <Badge variant="outline" className="text-[10px]">Private</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {batchId ? (
        <div className="flex items-center gap-2">
          <Input
            value={content}
            placeholder={
              selectedStudent
                ? `Message ${fullName(selectedStudent.user.firstName, selectedStudent.user.lastName)}...`
                : `Message ${batches.find((b) => b.id === batchId)?.name ?? "batch"}...`
            }
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <Button onClick={sendMessage} disabled={sending || !content.trim()}>
            <Send /> Send
          </Button>
        </div>
      ) : null}
    </div>
  )
}
