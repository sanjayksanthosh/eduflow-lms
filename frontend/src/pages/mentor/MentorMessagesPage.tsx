import { useEffect, useRef, useState } from "react"
import { MessageSquare, Send } from "lucide-react"
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
import { useAuth } from "@/context/AuthContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDateTime, fullName } from "@/lib/format"

interface MentorBatchSummary {
  id: string
  name: string
  code: string
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; role: string; profileImage: string | null }
}

export function MentorMessagesPage() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<MentorBatchSummary[]>([])
  const [batchId, setBatchId] = useState("")
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

  const handleBatchChange = (value: string) => {
    setBatchId(value)
    setMessages([])
    void loadMessages(value)
  }

  const sendMessage = async () => {
    if (!batchId || !content.trim()) return
    setSending(true)
    try {
      await api.post(`/mentor/batches/${batchId}/messages`, { content: content.trim() })
      setContent("")
      void loadMessages(batchId)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Chat with your batch students." />

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
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => {
                const isMine = message.sender.id === user?.id
                return (
                  <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg border p-3 ${
                        isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {!isMine ? (
                        <p className="mb-1 text-xs font-medium opacity-80">
                          {message.sender.role === "MENTOR"
                            ? fullName(message.sender.firstName, message.sender.lastName)
                            : message.sender.firstName}
                        </p>
                      ) : null}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`mt-1 text-xs ${isMine ? "opacity-70" : "text-muted-foreground"}`}>
                        {formatDateTime(message.createdAt)}
                      </p>
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
            placeholder="Type a message..."
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
