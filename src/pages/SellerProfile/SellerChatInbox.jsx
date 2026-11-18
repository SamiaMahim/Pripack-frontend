/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { base_url } from "../../config/config";
import { AttachButton, PendingAttachment, MessageAttachment } from "../supportchat/ChatAttachment";
import useChatAutoScroll from "../../Utils/useChatAutoScroll";

const SellerChatPanel = ({ supportId, bName, sellerId, sellerName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { scrollRef, onScroll, followNext } = useChatAutoScroll(messages, supportId);
  const [isSending, setIsSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachError, setAttachError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${base_url}/schat/${supportId}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching seller chat:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1000);
    return () => clearInterval(interval);
  }, [supportId]);

  // Keep marking customer messages as seen while this conversation stays open, not just on first open.
  const markingRead = useRef(false);
  const hasUnseen = messages.some((m) => m.sender === "user" && m.read === false);

  useEffect(() => {
    if (!hasUnseen || markingRead.current || document.visibilityState !== "visible") return;
    markingRead.current = true;
    fetch(`${base_url}/schat/mark-read/${encodeURIComponent(supportId)}`, { method: "POST" })
      .then(() => setMessages((prev) => prev.map((m) => (m.sender === "user" ? { ...m, read: true } : m))))
      .catch(() => {})
      .finally(() => { markingRead.current = false; });
  }, [hasUnseen, messages, supportId]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachment) || isSending) return;
    const last = messages[messages.length - 1];

    const message = {
      supportId,
      bId: last?.bId,
      bName,
      text: inputValue,
      ...(attachment ? { attachment } : {}),
      time: new Date(),
      sender: "manager",
      targetType: "seller",
      sellerId,
      sellerName,
      productId: last?.productId || null,
      productName: last?.productName || null,
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
    } catch (err) {
      console.error("Error sending seller reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 border-b bg-slate-800 text-white">
        <span className="font-semibold text-sm">{bName || "Customer"}</span>
        <button onClick={onClose} className="text-sm text-gray-300 hover:text-white lg:hidden">✕</button>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">No messages yet.</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              {msg.productName && msg.sender === "user" && (
                <p className="text-[10px] text-slate-400 mb-1">Re: {msg.productName}</p>
              )}
              <div className={`chat ${msg.sender === "manager" ? "chat-end" : "chat-start"}`}>
                <div className="chat-header flex flex-row items-center">
                  <p className="font-medium text-sm">{msg.sender === "manager" ? "You" : bName}</p>
                  <time className="text-xs opacity-50 ml-1">{new Date(msg.time).toLocaleTimeString()}</time>
                </div>
                <div className={`chat-bubble w-fit space-y-1 ${msg.sender === "manager" ? "bg-slate-800 text-white" : "bg-gray-100 text-black"}`}>
                  <MessageAttachment attachment={msg.attachment} dark={msg.sender === "manager"} />
                  {msg.text && <p>{msg.text}</p>}
                </div>
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
          placeholder="Reply to customer..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-l-md focus:outline-none focus:ring-0"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={(!inputValue.trim() && !attachment) || isSending}
          className={`px-4 py-2 rounded-r-md text-white text-sm font-medium ${
            (!inputValue.trim() && !attachment) || isSending ? "bg-gray-300 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const SellerChatInbox = ({ seller }) => {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const sellerId = seller?.userId || seller?._id;

  const loadConversations = () => {
    if (!sellerId) return;
    fetch(`${base_url}/sellerchat/${sellerId}`)
      .then((res) => res.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching seller conversations:", err));
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const active = conversations.find((c) => c._id === activeId);

  return (
    <div className="w-full">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-y-auto max-h-[min(560px,70vh)]">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition ${
                  activeId === c._id ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm text-slate-800">{c.bName}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.productName && <p className="text-[10px] text-slate-400">Re: {c.productName}</p>}
                <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 h-[min(560px,70vh)]">
          {active ? (
            <SellerChatPanel
              supportId={active._id}
              bName={active.bName}
              sellerId={sellerId}
              sellerName={seller?.name}
              onClose={() => setActiveId(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-white border border-slate-200 rounded-xl">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerChatInbox;
