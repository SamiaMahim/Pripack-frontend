import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { base_url,chat_url } from "../../config/config";
import { onOpenSupportChat } from "../../Utils/chatBridge";
import { AttachButton, PendingAttachment, MessageAttachment } from "./ChatAttachment";
import useChatAutoScroll from "../../Utils/useChatAutoScroll";

// Consecutive messages from the same side within this window share one name header.
const GROUP_WINDOW_MS = 15 * 60 * 1000;

const isSameGroup = (prev, msg) =>
  !!prev &&
  (prev.sender === "user") === (msg.sender === "user") &&
  Math.abs(new Date(msg.time) - new Date(prev.time)) < GROUP_WINDOW_MS;

// ✓ sent, blue ✓✓ once support has opened the conversation (message.read).
const SeenTicks = ({ seen }) => (
  <span title={seen ? "Seen" : "Sent"} className={seen ? "text-blue-500" : "text-gray-400"}>
    <svg width={seen ? 16 : 11} height="10" viewBox={seen ? "0 0 16 10" : "0 0 11 10"} fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5.5 4 8.5 10 1.5" />
      {seen && <path d="M6.5 8 7 8.5 13 1.5" />}
    </svg>
  </span>
);

const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [supportId, setSupportId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [socket, setSocket] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingContext, setPendingContext] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [attachError, setAttachError] = useState("");
  const markingRead = useRef(false);
  const { scrollRef, onScroll, followNext } = useChatAutoScroll(messages, `${isOpen}-${isFormSubmitted}-${supportId}`);

  // Staff replies the customer hasn't seen yet — tracked on each message (userRead) by the backend.
  const unreadCount = messages.filter((m) => m.sender !== "user" && m.userRead === false).length;

  useEffect(() => {
    if (!isOpen || !supportId || unreadCount === 0 || markingRead.current || document.visibilityState !== "visible") return;
    markingRead.current = true;
    setMessages((prev) => prev.map((m) => (m.sender !== "user" ? { ...m, userRead: true } : m)));
    fetch(`${base_url}/schat/mark-user-read/${encodeURIComponent(supportId)}`, { method: "POST" })
      .catch((err) => console.error("Error marking support messages as seen:", err))
      .finally(() => { markingRead.current = false; });
  }, [isOpen, supportId, unreadCount]);

  useEffect(() => {
    return onOpenSupportChat((context) => {
      setIsOpen(true);
      if (context?.prefillText) setInputValue(context.prefillText);
      if (context?.productId) {
        setPendingContext({ productId: context.productId, productName: context.productName });
      }
    });
  }, []);


  const fetchMessages = async () => {
    if (!supportId) return;
    try {
      const response = await fetch(`${base_url}/schat/${supportId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching support chat messages:", err);
    }
  };

  useEffect(() => {
    if (!supportId) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000); 

    if (socket) socket.close();
    const newSocket = new WebSocket(`${chat_url}?supportId=${supportId}`);

    newSocket.onopen = () => console.log("Support chat WebSocket connected");
    newSocket.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => {
        if (!prev.some((msg) => msg.time === newMessage.time && msg.text === newMessage.text)) {
          return [...prev, newMessage];
        }
        return prev;
      });
    };
    newSocket.onclose = () => console.log("Support chat WebSocket closed");

    setSocket(newSocket);
    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, [supportId]);

 
  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !attachment) || !supportId || isSending) return;

    const message = {
      supportId,
      bId: userInfo.email,
      bName: userInfo.name,
      text: inputValue,
      ...(attachment ? { attachment } : {}),
      time: new Date(),
      sender: "user",
      ...(pendingContext ? {
        productId: pendingContext.productId,
        productName: pendingContext.productName,
      } : {}),
    };

    setIsSending(true);
    try {
      await fetch(`${base_url}/addschat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }

      followNext();
      setMessages((prev) => [...prev, message]);
      setInputValue("");
      setAttachment(null);
      setPendingContext(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };


  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (userInfo.name.trim() && userInfo.email.trim()) {
      const emailId = userInfo.email.trim().toLowerCase();
      setSupportId(emailId);
      setIsFormSubmitted(true);
      localStorage.setItem("supportUser", JSON.stringify(userInfo)); 
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("supportUser");
    if (saved) {
      const user = JSON.parse(saved);
      setUserInfo(user);
      setSupportId(user.email);
      setIsFormSubmitted(true);
    }
  }, []);

  return (
    <div className="fixed lg:bottom-6 right-6 bottom-20 z-50">
    
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
          aria-label={unreadCount ? `Support chat, ${unreadCount} new messages` : "Support chat"}
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-fadeIn">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-blue-600 text-white">
            <span className="font-semibold">Support Chat</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-200 hover:text-white"
            >
              ✕
            </button>
          </div>

         
          {!isFormSubmitted ? (
            <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
              <p className="text-gray-600 text-sm">
                Please enter your details before starting chat:
              </p>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={userInfo.name}
                onChange={(e) =>
                  setUserInfo({ ...userInfo, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={userInfo.email}
                onChange={(e) =>
                  setUserInfo({ ...userInfo, email: e.target.value })
                }
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-all"
              >
                Start Chat
              </button>
            </form>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-y-auto px-4 py-3"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#93c5fd #f1f5f9",
                  maxHeight: "60vh",
                }}
              >
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">
                    Start your conversation below 👋
                  </p>
                ) : (
                  messages.map((msg, i) => {
                    const isUser = msg.sender === "user";
                    const startsGroup = !isSameGroup(messages[i - 1], msg);
                    const time = new Date(msg.time);
                    return (
                      <div
                        key={i}
                        className={`chat ${isUser ? "chat-end" : "chat-start"} ${
                          startsGroup ? (i > 0 ? "mt-3" : "") : "pt-0"
                        }`}
                      >
                        {startsGroup && (
                          <div className="chat-header">
                            <p className="font-medium text-sm">
                              {isUser ? userInfo.name : "Support Team"}
                            </p>
                          </div>
                        )}
                        <div
                          className={`chat-bubble w-fit space-y-1 ${
                            isUser ? "bg-cyan-50 text-black" : "bg-gray-100 text-black"
                          } ${startsGroup ? "" : "before:hidden"}`}
                        >
                          <MessageAttachment attachment={msg.attachment} />
                          {msg.text && <p>{msg.text}</p>}
                          <div className="flex items-center justify-end gap-1 -mb-1 text-[10px] leading-none text-gray-400">
                            <time title={time.toLocaleString()}>
                              {time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </time>
                            {isUser && <SeenTicks seen={msg.read === true} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

         
              <PendingAttachment attachment={attachment} error={attachError} onRemove={() => setAttachment(null)} />
              <div className="border-t flex items-center p-2">
                <AttachButton onUploaded={setAttachment} onError={setAttachError} disabled={isSending} />
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-l-md focus:outline-none focus:ring-0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !attachment) || isSending}
                  className={`px-4 py-2 rounded-r-md text-white text-sm font-medium ${
                    (!inputValue.trim() && !attachment) || isSending
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SupportChat;
