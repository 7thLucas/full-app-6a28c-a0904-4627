export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm"
      style={{ backgroundColor: "var(--primary)" }}
      aria-label="Coach is typing"
    >
      <span className="typing-dot w-2 h-2 rounded-full bg-white/70 inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-white/70 inline-block" />
      <span className="typing-dot w-2 h-2 rounded-full bg-white/70 inline-block" />
    </div>
  );
}
