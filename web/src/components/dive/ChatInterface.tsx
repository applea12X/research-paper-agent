"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plus } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Replace with actual API call to FastAPI endpoint
    // Simulate API response for now
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. The backend API endpoint will be connected soon.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-medium text-white/90 mb-12">
              Ready when you are.
            </h2>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-32">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-3.5 backdrop-blur-xl ${
                    message.role === "user"
                      ? "bg-blue-500/20 text-white border border-blue-500/30 shadow-lg"
                      : "bg-white/5 text-white/95 border border-white/10"
                  }`}
                  style={{
                    backdropFilter: "blur(20px) saturate(180%)",
                  }}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="bg-white/5 text-white/90 border border-white/10 rounded-3xl px-5 py-3.5 backdrop-blur-xl"
                  style={{
                    backdropFilter: "blur(20px) saturate(180%)",
                  }}
                >
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form - Centered at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div
              className="relative rounded-[28px] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
              style={{
                backdropFilter: "blur(40px) saturate(180%)",
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5 text-white/60" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-white/40 mt-3 text-center">
              Backend API integration pending - responses are currently simulated
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
