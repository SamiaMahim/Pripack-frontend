import { useCallback, useEffect, useRef, useState } from "react";
import { partnerRequest } from "../../Utils/partnerApi";
import { AttachButton, PendingAttachment, MessageAttachment } from "../supportchat/ChatAttachment";

const POLL_MS = 5000;

const formatTime = (t) => new Date(t).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// Private chat between the logged-in seller/supplier and the admin team.
// Polls every few seconds while the tab is open.
const PartnerAdminChat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachError, setAttachError] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await partnerRequest("/partner/chat");
      setMessages(data.messages || []);
      setError("");
      if ((data.messages || []).some((m) => m.sender === "admin" && !m.readByPartner)) {
        partnerRequest("/partner/chat/read", { method: "POST", body: {} }).catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const send = async () => {
    if ((!text.trim() && !attachment) || sending) return;
    setSending(true);
    try {
      const data = await partnerRequest("/partner/chat", {
        method: "POST",
        body: { text, ...(attachment ? { attachment } : {}) },
      });
      setMessages((prev) => [...prev, data.message]);
      setText("");
      setAttachment(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[min(560px,70vh)] border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b bg-slate-50">
        <p className="font-semibold text-slate-800 text-sm">Chat with admin</p>
        <p className="text-xs text-slate-500">Questions about approval, orders, payments or pickups.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-white">
        {messages.length === 0 && <p className="text-center text-sm text-slate-400 mt-10">No messages yet. Say hello to the admin team.</p>}
        {messages.map((m) => {
          const mine = m.sender === "partner";
          return (
            <div key={m._id} className={`max-w-[80%] ${mine ? "self-end items-end" : "self-start items-start"} flex flex-col`}>
              <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${mine ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.text}
                {m.attachment && <div className="mt-1"><MessageAttachment attachment={m.attachment} dark={mine} /></div>}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {mine ? "You" : "Admin"} · {formatTime(m.time)}{mine && m.readByAdmin ? " · Seen" : ""}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-red-500 px-4 py-1">{error}</p>}
      {(attachment || attachError) && (
        <div className="px-4 pt-2"><PendingAttachment attachment={attachment} error={attachError} onRemove={() => { setAttachment(null); setAttachError(""); }} /></div>
      )}

      <div className="flex items-center gap-2 border-t px-3 py-2">
        <AttachButton
          disabled={sending}
          onUploaded={(a) => { setAttachment(a); setAttachError(""); }}
          onError={setAttachError}
        />
        <input
          className="input input-bordered input-sm flex-1"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button onClick={send} disabled={sending || (!text.trim() && !attachment)} className="btn btn-sm bg-cyan-500 hover:bg-cyan-400 text-white border-none">
          Send
        </button>
      </div>
    </div>
  );
};

export default PartnerAdminChat;
