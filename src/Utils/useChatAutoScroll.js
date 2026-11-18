import { useEffect, useRef } from "react";

// Keeps a chat's message list pinned to the newest message — but only while the reader
// is already at (or near) the bottom, so scrolling up to read history isn't interrupted.
// The chats poll every second and replace `messages` each time, so we only react when
// the count actually grows.
//
// resetKey: change it (e.g. on open / switching conversation) to jump back to the latest message.
const useChatAutoScroll = (messages, resetKey) => {
  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    if (messages.length > lastCount.current && stickToBottom.current) scrollToBottom();
    lastCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    stickToBottom.current = true;
    lastCount.current = 0;
    scrollToBottom();
  }, [resetKey]);

  // Call before adding the reader's own message so it is always brought into view.
  const followNext = () => { stickToBottom.current = true; };

  return { scrollRef, onScroll, followNext };
};

export default useChatAutoScroll;
