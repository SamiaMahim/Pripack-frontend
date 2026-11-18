/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { Paperclip, FileText, X, Loader2, Download } from "lucide-react";
import { base_url } from "../../config/config";

// Keep in sync with CHAT_MAX_FILE_SIZE / CHAT_ALLOWED_EXTS in rBackend/src/middleware/upload.js
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.ai,.psd,.eps,.cdr";

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export const isImageAttachment = (attachment) =>
  attachment?.type?.startsWith("image/") || IMAGE_EXT.test(attachment?.url || "");

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const uploadChatFile = async (file) => {
  if (file.size > MAX_FILE_SIZE) throw new Error("File is too large (max 20 MB)");

  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${base_url}/schat/upload`, { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
};

// Paperclip button: picks a file, uploads it, then hands the attachment back.
export const AttachButton = ({ onUploaded, onError, disabled, className = "" }) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    onError?.("");
    try {
      onUploaded(await uploadChatFile(file));
    } catch (err) {
      onError?.(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        title="Attach a file"
        className={`px-2 py-2 text-gray-500 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>
    </>
  );
};

// Chip above the input showing the file that will go out with the next message.
export const PendingAttachment = ({ attachment, onRemove, error }) => {
  if (!attachment && !error) return null;
  return (
    <div className="px-3 pt-2">
      {error && <p className="text-xs text-red-500">{error}</p>}
      {attachment && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-md px-2 py-1 text-xs text-gray-700">
          <FileText size={14} className="text-teal-600 shrink-0" />
          <span className="truncate flex-1">{attachment.name}</span>
          <span className="text-gray-400 shrink-0">{formatFileSize(attachment.size)}</span>
          <button type="button" onClick={onRemove} title="Remove" className="text-gray-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// Rendered inside a chat bubble.
export const MessageAttachment = ({ attachment, dark = false }) => {
  if (!attachment?.url) return null;
  const href = `${base_url}${attachment.url}`;

  if (isImageAttachment(attachment)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <img src={href} alt={attachment.name} className="max-w-[220px] max-h-[220px] rounded-md object-cover" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 max-w-[240px] border ${
        dark ? "border-white/30 hover:bg-white/10" : "border-gray-300 bg-white hover:bg-gray-50"
      }`}
    >
      <FileText size={18} className="shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-sm truncate">{attachment.name}</span>
        {attachment.size != null && (
          <span className="block text-[10px] opacity-70">{formatFileSize(attachment.size)}</span>
        )}
      </span>
      <Download size={14} className="shrink-0 opacity-70" />
    </a>
  );
};
