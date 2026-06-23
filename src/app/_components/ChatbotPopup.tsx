"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  isLoading?: boolean;
}

export default function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Halo! Saya Asisten Virtual Laung. Ada yang bisa saya bantu mengenai produk kami?",
      time: "00:00",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputMessage,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userQuestion = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    const loadingMsgId = `loading-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMsgId,
        sender: "bot",
        text: "Sedang memproses pertanyaan Anda...",
        time: getCurrentTime(),
        isLoading: true,
      },
    ]);

    try {
      const response = await fetch(
        `/api/chat-bot?q=${encodeURIComponent(userQuestion)}`,
      );
      const data = await response.json();

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsgId));

      if (data.success) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text:
            data.answer ||
            "Maaf, saya tidak bisa menjawab pertanyaan tersebut.",
          time: getCurrentTime(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: Message = {
          id: `bot-error-${Date.now()}`,
          sender: "bot",
          text: "Maaf, terjadi kesalahan dalam memproses pertanyaan Anda. Silakan coba lagi nanti.",
          time: getCurrentTime(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsgId));

      const errorMsg: Message = {
        id: `bot-error-${Date.now()}`,
        sender: "bot",
        text: "Maaf, terjadi kesalahan koneksi. Silakan periksa koneksi internet Anda dan coba lagi.",
        time: getCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #059669, #0d9488)",
        }}
        aria-label="Buka Chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.222 3.419.169l2.25 2.25a.75.75 0 0 0 1.25-.53v-2.25h2.88c1.584 0 2.707-1.393 2.707-2.992V7.498c0-1.599-1.123-2.992-2.707-2.992H5.166c-1.584 0-2.707 1.393-2.707 2.992v5.271Z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative flex h-[80vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-100 bg-white shadow-2xl transition-all md:h-[70vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-bold text-emerald-600">
                  ⚓
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Asisten Laung
                  </h3>
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />{" "}
                    Online · Siap Membantu
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.sender === "user"
                        ? "rounded-tr-none bg-emerald-600 text-white"
                        : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
                    } ${msg.isLoading ? "animate-pulse" : ""}`}
                  >
                    <p className="text-[14px] leading-relaxed font-medium whitespace-pre-line">
                      {msg.text}
                    </p>
                    <span
                      className={`mt-1 block text-right text-[10px] ${
                        msg.sender === "user"
                          ? "text-emerald-100"
                          : "text-slate-400"
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="flex gap-2 rounded-b-3xl border-t border-slate-100 bg-white p-4"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanyakan sesuatu tentang produk Laung..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:scale-100 disabled:opacity-40"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 rotate-360 transform"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
