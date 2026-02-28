"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Sparkles, Loader2, Minimize2, Trash2 } from "lucide-react";
import { useScreenContent } from "@/lib/hooks/useScreenContent";
import { useAuth } from "@/components/providers/AuthProvider";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export function Assistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { content: screenContent } = useScreenContent();
    const { session } = useAuth();

    // Load history and window state on mount
    useEffect(() => {
        const storedMsgs = localStorage.getItem("assistant_messages");
        if (storedMsgs) {
            try {
                setMessages(JSON.parse(storedMsgs));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }

        const storedOpen = localStorage.getItem("assistant_isOpen");
        if (storedOpen === "true") setIsOpen(true);
    }, []);

    // Save history and window state on change
    useEffect(() => {
        localStorage.setItem("assistant_messages", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem("assistant_isOpen", isOpen.toString());
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // Using 127.0.0.1 to avoid IPv6/CORS quirks on some browsers
            const headers: Record<string, string> = { "Content-Type": "application/json" };

            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            } else {
                // If there's no Supabase session but we're on the dashboard, it must be a demo user
                headers["X-Demo-User"] = "true";
            }

            const response = await fetch("http://127.0.0.1:8000/chat", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    context: screenContent
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to fetch from assistant");
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: `System Error: ${error.message}. Please check the backend console for more details!` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-[var(--color-card)] border border-[var(--color-border)] w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-primary)]/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Manager Assistant</h3>
                                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Gemini Powered</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        if (confirm("Clear your chat history?")) setMessages([]);
                                    }}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Clear Chat"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-400" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                    <Minimize2 className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="text-center py-10 space-y-2">
                                    <p className="text-gray-400 text-sm">Welcome back! I'm here to help you manage your tasks and stay motivated.</p>
                                    <p className="text-xs text-[var(--color-primary)] font-medium">"Focus is the key to extraordinary results."</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-[var(--color-primary)] text-white rounded-br-none" : "bg-white/5 border border-[var(--color-border)] text-gray-200 rounded-bl-none"}`}>
                                        {msg.role === "assistant" ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                                    em: ({ children }) => <em className="italic opacity-90">{children}</em>,
                                                    h1: ({ children }) => <h1 className="font-bold text-base mb-1 text-white">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="font-bold text-sm mb-1 text-white">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="font-semibold text-sm mb-0.5 text-white">{children}</h3>,
                                                    code: ({ children }) => <code className="bg-black/30 rounded px-1 py-0.5 text-xs font-mono text-emerald-300">{children}</code>,
                                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--color-primary)] pl-2 my-1 opacity-80 italic">{children}</blockquote>,
                                                    hr: () => <hr className="border-white/10 my-2" />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-[var(--color-border)] p-3 rounded-2xl rounded-bl-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-[var(--color-border)]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask your manager..."
                                    className="flex-1 bg-white/5 border border-[var(--color-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="bg-[var(--color-primary)] text-white p-2 rounded-xl hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-[var(--color-primary)] text-white w-14 h-14 rounded-full shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center hover:bg-opacity-90 transition-all group"
                    >
                        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
