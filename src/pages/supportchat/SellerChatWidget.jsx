/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { base_url } from "../../config/config";
import { AttachButton, PendingAttachment, MessageAttachment } from "./ChatAttachment";
import useChatAutoScroll from "../../Utils/useChatAutoScroll";

const SellerChatWidget = ({ sellerId, sellerName, productId, productName, buttonClassName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { scrollRef, onScroll, followNext } = useChatAutoScroll(messages, `${isOpen}-${isFormSubmitted}`);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachError, setAttachError] = useState("");

  const supportId = userInfo.email
    ? `${userInfo.email.trim().toLowerCase()}__seller__${sellerId}`
    : null;

  useEffect(() => {
    if (!isOpen || isFormSubmitted) return;
    const saved = localStorage.getItem("supportUser");
    if (saved) {
      const user = JSON.parse(saved);
      setUserInfo(user);
      setIsFormSubmitted(true);
    }
  }, [isOpen, isFormSubmitted]);

  useEffect(() => {
    if (!isOpen || !supportId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${base_url}/schat/${supportId}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching seller chat messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval);
  }, [isOpen, supportId]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (userInfo.name.trim() && userInfo.email.trim()) {
      localStorage.setItem("supportUser", JSON.stringify(userInfo));
      setIsFormSubmitted(true);
    }
  };

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
      targetType: "seller",
      sellerId,
      sellerName,
      productId,
      productName,
    };

    setIsSending(true);
    try {
      await fetch(`${base_url}/addschat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      followNext();
      setMessages((prev) => [...prev, message]);
      setInputValue("");
      setAttachment(null);
    } catch (error) {
      console.error("Error sending message to seller:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={buttonClassName || "flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition"}
        >
          <MessageCircle size={16} />
          Chat with Seller
        </button>
      ) : (
        // Open state: the button expands into the chat card, becoming its header.
        <div className="w-full max-w-md bg-white rounded-lg shadow-md border-2 border-teal-500 overflow-hidden flex flex-col">
          <button
            onClick={() => setIsOpen(false)}
            className="flex justify-between items-center px-4 h-10 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-sm">
              <MessageCircle size={16} />
              Chat with Seller
            </span>
            <span className="text-sm">✕</span>
          </button>

          {!isFormSubmitted ? (
            <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
              <p className="text-gray-600 text-sm">Please enter your details before starting chat:</p>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={userInfo.name}
                onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={userInfo.email}
                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
              />
              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg text-sm font-medium transition-all"
              >
                Start Chat
              </button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ maxHeight: "50vh" }}>
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">
                    {productName ? `Ask about "${productName}" 👋` : "Start your conversation below 👋"}
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}>
                      <div className="chat-header flex flex-row items-center">
                        <p className="font-medium text-sm">
                          {msg.sender === "user" ? userInfo.name : (sellerName || "Seller")}
                        </p>
                        <time className="text-xs opacity-50 ml-1">
                          {new Date(msg.time).toLocaleTimeString()}
                        </time>
                      </div>
                      <div className={`chat-bubble w-fit space-y-1 ${msg.sender === "user" ? "bg-teal-50 text-black" : "bg-gray-100 text-black"}`}>
                        <MessageAttachment attachment={msg.attachment} />
                        {msg.text && <p>{msg.text}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <PendingAttachment attachment={attachment} error={attachError} onRemove={() => setAttachment(null)} />
              <div className="border-t flex items-center p-2">
                <AttachButton onUploaded={setAttachment} onError={setAttachError} disabled={isSending} />
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-l-md focus:outline-none focus:border-teal-500"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !attachment) || isSending}
                  className={`px-4 py-2 rounded-r-md text-white text-sm font-medium ${
                    (!inputValue.trim() && !attachment) || isSending ? "bg-gray-300 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
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

export default SellerChatWidget;
