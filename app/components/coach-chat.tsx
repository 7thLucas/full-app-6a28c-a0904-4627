import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Send, ChevronDown, TrendingUp, Check } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import { invokeLLM } from "@qb/agentic";
import { LevelIndicator } from "./level-indicator";
import { CoachAvatar } from "./coach-avatar";
import { TypingIndicator } from "./typing-indicator";
import { saveSnapshot } from "~/hooks/use-influence-timeline";
import { cn } from "~/lib/utils";

export type MessageRole = "user" | "coach";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  detectedLevel?: number | null;
}

const SYSTEM_PROMPT = `You are Influence Coach, an expert AI coaching assistant specializing in John Maxwell's 5 Levels of Leadership framework. Your role is to help leaders diagnose their current level of influence and give them concise, actionable coaching to deepen or advance their influence.

Maxwell's 5 Levels:
1. Position — People follow because they have to (title/authority only)
2. Permission — People follow because they want to (relationship-based)
3. Production — People follow because of results you create for the organization
4. People Development — People follow because of how you've invested in them personally
5. Pinnacle — People follow because of who you are and what you represent (legacy)

Your coaching approach:
- DIAGNOSE FIRST: Before giving advice, understand the leader's situation, context, and relationships through diagnostic questions.
- ONE QUESTION AT A TIME: During the diagnosis phase, ask exactly ONE single question per message. Wait for the leader's answer, then ask the next single question, gradually building toward a level read. NEVER stack or combine multiple questions in one message during diagnosis.
- Be empathetic, warm, and encouraging — never judgmental.
- Keep advice concise and immediately actionable (2-3 bullet points max per response).
- Reference specific Maxwell levels by name and number when relevant.
- Celebrate growth and progress.
- Meet leaders where they are — a Level 1 leader needs different coaching than a Level 4.

When you detect which level a leader is operating at, include it in your JSON response as detectedLevel (1-5). If you cannot determine a level yet, set detectedLevel to null.

Always respond in the tone of an experienced, empathetic executive coach. Keep responses focused and under 200 words unless deeper exploration is needed.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    detectedLevel: {
      oneOf: [
        { type: "integer", minimum: 1, maximum: 5 },
        { type: "null" },
      ],
    },
  },
  required: ["reply", "detectedLevel"],
  additionalProperties: false,
};

function buildConversationContext(messages: ChatMessage[]): string {
  if (messages.length === 0) return "";
  const lines = messages.map((m) => {
    const speaker = m.role === "coach" ? "Coach" : "Leader";
    return `${speaker}: ${m.content}`;
  });
  return lines.join("\n\n");
}

function deriveSessionSummary(messages: ChatMessage[]): string {
  // Prefer the most recent substantive coach message as the session takeaway.
  const lastCoach = [...messages]
    .reverse()
    .find((m) => m.role === "coach" && m.content.trim().length > 0);
  const raw = lastCoach?.content ?? "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  return collapsed.length > 280 ? `${collapsed.slice(0, 277)}...` : collapsed;
}

export function CoachChat() {
  const { config } = useConfigurables();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const coachName = config.coachName ?? "Influence Coach";
  const welcomeMessage =
    config.welcomeMessage ??
    "Welcome! I'm your Influence Coach. Tell me about your leadership situation and let's get started.";
  const chatPlaceholder =
    config.chatPlaceholder ?? "Describe your leadership situation...";
  const ctaLabel = config.ctaLabel ?? "Start Coaching";
  const showLevelIndicator = config.showLevelIndicator ?? true;
  const maxwellLevels = config.maxwellLevels ?? [];

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isThinking, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 120);
  }, []);

  const handleStart = useCallback(() => {
    setStarted(true);
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      content: welcomeMessage,
      timestamp: new Date(),
      detectedLevel: null,
    };
    setMessages([welcomeMsg]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [welcomeMessage]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const conversationHistory = buildConversationContext([...messages, userMsg]);
      const messageWithContext =
        messages.length > 0
          ? `[Conversation so far]\n${conversationHistory}\n\n[New message from Leader]\n${trimmed}`
          : trimmed;

      const result = await invokeLLM({
        message: messageWithContext,
        schema: RESPONSE_SCHEMA,
        systemPrompt: SYSTEM_PROMPT,
      });

      const responseData = result.response as { reply?: string; detectedLevel?: number | null } | null;
      const reply = responseData?.reply ?? "I encountered an issue processing your message. Please try again.";
      const detectedLevel = responseData?.detectedLevel ?? null;

      if (detectedLevel != null) {
        setCurrentLevel(detectedLevel);
      }

      const coachMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "coach",
        content: reply,
        timestamp: new Date(),
        detectedLevel,
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error("LLM error:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "coach",
        content:
          "I'm having trouble connecting right now. Please check your connection and try again.",
        timestamp: new Date(),
        detectedLevel: null,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  const handleSaveSnapshot = useCallback(
    async (navigateAfter: boolean) => {
      if (currentLevel == null || savingSnapshot) return;
      setSavingSnapshot(true);
      try {
        const saved = await saveSnapshot({
          level: currentLevel,
          summary: deriveSessionSummary(messages),
        });
        if (saved) {
          setSnapshotSaved(true);
          if (navigateAfter) {
            navigate("/timeline");
            return;
          }
          setTimeout(() => setSnapshotSaved(false), 2500);
        }
      } finally {
        setSavingSnapshot(false);
      }
    },
    [currentLevel, savingSnapshot, messages, navigate],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    },
    [],
  );

  // Landing screen
  if (!started) {
    return (
      <LandingScreen
        config={config}
        coachName={coachName}
        ctaLabel={ctaLabel}
        maxwellLevels={maxwellLevels}
        onStart={handleStart}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b border-border shadow-sm"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <CoachAvatar size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{coachName}</p>
          <p className="text-white/60 text-xs">Maxwell 5 Levels Coach</p>
        </div>
        {showLevelIndicator && currentLevel != null && (
          <div className="flex-shrink-0">
            <LevelIndicator currentLevel={currentLevel} maxwellLevels={maxwellLevels} compact />
          </div>
        )}
        <Link
          to="/timeline"
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
          aria-label="View growth timeline"
          title="View growth timeline"
        >
          <TrendingUp className="w-5 h-5 text-white" />
        </Link>
      </header>

      {/* Level bar */}
      {showLevelIndicator && (
        <div className="px-4 py-2 bg-muted border-b border-border">
          <LevelIndicator currentLevel={currentLevel} maxwellLevels={maxwellLevels} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-4"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} coachName={coachName} />
        ))}
        {isThinking && (
          <div className="flex items-end gap-2">
            <CoachAvatar size="sm" />
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="fixed bottom-24 right-4 w-9 h-9 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-10 hover:bg-primary/90 transition-all"
          style={{ backgroundColor: "var(--primary)" }}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Save-snapshot bar — appears once a level has been diagnosed */}
      {currentLevel != null && (
        <div className="border-t border-border bg-muted px-4 py-2">
          <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
            <p className="text-xs text-muted-foreground min-w-0 truncate">
              {snapshotSaved
                ? "Snapshot saved to your timeline"
                : "End of session? Save a snapshot of your progress."}
            </p>
            <button
              type="button"
              onClick={() => handleSaveSnapshot(true)}
              disabled={savingSnapshot}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                "shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              style={{ backgroundColor: "var(--accent)", color: "var(--primary)" }}
            >
              {snapshotSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {savingSnapshot ? "Saving..." : snapshotSaved ? "Saved" : "Save & view timeline"}
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={chatPlaceholder}
              disabled={isThinking}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                "placeholder:text-muted-foreground transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "max-h-[120px] overflow-y-auto"
              )}
              style={{ minHeight: "48px" }}
            />
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
            className={cn(
              "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
              "transition-all shadow-md",
              input.trim() && !isThinking
                ? "text-white hover:opacity-90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            style={
              input.trim() && !isThinking
                ? { backgroundColor: "var(--accent)" }
                : undefined
            }
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {config.footerText ?? "Influence Coach — Powered by Maxwell's 5 Levels of Leadership"}
        </p>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  coachName: string;
}

function MessageBubble({ message, coachName }: MessageBubbleProps) {
  const isCoach = message.role === "coach";

  if (isCoach) {
    return (
      <div className="flex items-end gap-2 max-w-[85%]">
        <CoachAvatar size="sm" />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground ml-1">{coachName}</span>
          <div
            className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm"
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
            }}
          >
            <FormattedMessage content={message.content} isCoach />
          </div>
          {message.detectedLevel != null && (
            <span className="text-xs ml-1 mt-0.5" style={{ color: "var(--accent)" }}>
              Level {message.detectedLevel} detected
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 shadow-sm"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--primary)",
        }}
      >
        <FormattedMessage content={message.content} isCoach={false} />
      </div>
    </div>
  );
}

// ─── Formatted Message ────────────────────────────────────────────────────────

function FormattedMessage({ content, isCoach }: { content: string; isCoach: boolean }) {
  // Split into paragraphs and handle bullet points
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {paragraphs.map((paragraph, i) => {
        const lines = paragraph.split(/\n/);
        const isBulletList = lines.some((l) => /^[-•*]\s/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={i} className="space-y-1 list-none">
              {lines.map((line, j) => {
                const cleaned = line.replace(/^[-•*]\s*/, "").trim();
                if (!cleaned) return null;
                return (
                  <li key={j} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isCoach ? "var(--accent)" : "var(--primary)",
                      }}
                    />
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={i} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

interface LandingScreenProps {
  config: ReturnType<typeof useConfigurables>["config"];
  coachName: string;
  ctaLabel: string;
  maxwellLevels: Array<{ level: number; name: string; description: string }>;
  onStart: () => void;
}

function LandingScreen({
  config,
  coachName,
  ctaLabel,
  maxwellLevels,
  onStart,
}: LandingScreenProps) {
  const appName = config.appName ?? "Influence Coach";
  const tagline =
    config.tagline ?? "Build Your Leadership Influence with Maxwell's 5 Levels";

  const levels =
    maxwellLevels.length > 0
      ? maxwellLevels
      : [
          { level: 1, name: "Position", description: "People follow because they have to" },
          { level: 2, name: "Permission", description: "People follow because they want to" },
          { level: 3, name: "Production", description: "People follow because of results" },
          { level: 4, name: "People Development", description: "People follow because of your investment" },
          { level: 5, name: "Pinnacle", description: "People follow because of who you are" },
        ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Hero */}
      <div
        className="flex flex-col items-center justify-center px-6 py-16 text-white text-center flex-shrink-0"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {config.logoUrl && config.logoUrl !== "FILL_LOGO_URL_HERE" ? (
          <img
            src={config.logoUrl}
            alt={appName}
            className="w-20 h-20 rounded-full object-cover mb-6 border-4 border-white/20 shadow-xl"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white/20"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <span className="text-3xl font-bold text-white font-serif">IC</span>
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 font-serif text-white">
          {appName}
        </h1>
        <p className="text-white/80 text-base md:text-lg max-w-md leading-relaxed">
          {tagline}
        </p>
      </div>

      {/* Levels Preview */}
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h2
          className="text-lg font-semibold mb-5 font-serif"
          style={{ color: "var(--foreground)" }}
        >
          Maxwell's 5 Levels of Leadership
        </h2>
        <div className="space-y-3 mb-8">
          {levels.map((lvl) => (
            <div
              key={lvl.level}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 font-serif"
                style={{ backgroundColor: getLevelColor(lvl.level) }}
              >
                {lvl.level}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  {lvl.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{lvl.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Value propositions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Diagnose", desc: "Discover your current level of influence" },
            { label: "Grow", desc: "Get actionable steps to advance" },
            { label: "Lead", desc: "Build lasting, meaningful influence" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-border bg-card shadow-sm text-center"
            >
              <p
                className="font-semibold text-sm font-serif mb-1"
                style={{ color: "var(--accent)" }}
              >
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onStart}
          className="w-full py-4 px-8 rounded-2xl font-semibold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--primary)",
          }}
        >
          {ctaLabel}
        </button>
        <Link
          to="/timeline"
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-8 rounded-2xl font-medium text-sm border border-border bg-card hover:bg-muted transition-all"
          style={{ color: "var(--foreground)" }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
          View my growth timeline
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-4">
          {config.footerText ?? "Influence Coach — Powered by Maxwell's 5 Levels of Leadership"}
        </p>
      </div>
    </div>
  );
}

function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: "#4B4B4B",
    2: "#1f1f1f",
    3: "#2f8f48",
    4: "#38aa56",
    5: "#111111",
  };
  return colors[level] ?? "#38aa56";
}
