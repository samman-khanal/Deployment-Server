import { useRef, useState } from "react";
import {
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  AtSign,
} from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Button } from "../../components/ui/Button";

interface MentionableUser {
  id: string;
  name: string;
}

interface ChatInputProps {
  placeholder: string;
  onSend: (content: string, file?: File, mentionIds?: string[]) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  members?: MentionableUser[];
}

export default function ChatInput({ placeholder, onSend, onTyping, onStopTyping, disabled, members = [] }: ChatInputProps) {
  const [messageInput, setMessageInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    // Typing indicator
    if (onTyping && val.length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping();
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onStopTyping?.();
      }, 2500);
    } else if (onStopTyping && val.length === 0 && isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onStopTyping();
    }

    // Detect @mention: find last @ before cursor with no space/newline after it
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionHighlight(0);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  const insertMention = (member: MentionableUser) => {
    const cursor = textareaRef.current?.selectionStart ?? messageInput.length;
    const textBefore = messageInput.slice(0, cursor);
    const match = textBefore.match(/@([^\s@]*)$/);
    if (!match) return;

    const before = textBefore.slice(0, textBefore.length - match[0].length);
    const after = messageInput.slice(cursor);
    setMessageInput(before + `@${member.name} ` + after);
    setMentionedIds((prev) =>
      prev.includes(member.id) ? prev : [...prev, member.id],
    );
    setShowMentionDropdown(false);
    setMentionQuery("");
    // Re-focus textarea after selection
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionHighlight((h) => (h + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionHighlight((h) => (h - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[mentionHighlight]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentionDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const content = messageInput.trim();
    if (!content && !pendingFile) return;
    const file = pendingFile;
    const ids = mentionedIds.length ? [...mentionedIds] : undefined;
    setMessageInput("");
    setPendingFile(null);
    setMentionedIds([]);
    setShowMentionDropdown(false);
    // Stop typing indicator on send
    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onStopTyping?.();
    }
    onSend(content || "", file || undefined, ids);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        <div className="relative flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-600">
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
              showEmojiPicker
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          {members.length > 0 && (
            <button
              onClick={() => {
                setMessageInput((v) => v + "@");
                setShowMentionDropdown(true);
                setMentionQuery("");
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
              title="Mention someone"
            >
              <AtSign className="w-5 h-5" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingFile(f);
              e.target.value = "";
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingFile(f);
              e.target.value = "";
            }}
          />

          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute left-0 bottom-full mb-2 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    setMessageInput((prev) => prev + emoji.native);
                    setShowEmojiPicker(false);
                  }}
                  theme="auto"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            </>
          )}
        </div>

        {pendingFile && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
              {pendingFile.type.startsWith("image/") ? (
                <ImageIcon className="w-4 h-4 text-indigo-500" />
              ) : (
                <FileText className="w-4 h-4 text-indigo-500" />
              )}
              <span className="text-slate-700 dark:text-slate-300 max-w-50 truncate">
                {pendingFile.name}
              </span>
              <span className="text-slate-400 text-xs">
                ({(pendingFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={() => setPendingFile(null)}
                className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* @mention dropdown */}
        {showMentionDropdown && filteredMembers.length > 0 && (
          <div className="mx-3 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              Mention someone
            </div>
            {filteredMembers.map((member, idx) => (
              <button
                key={member.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(member);
                }}
                onMouseEnter={() => setMentionHighlight(idx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                  idx === mentionHighlight
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={messageInput}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none"
          rows={2}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-end p-3">
          <Button
            onClick={handleSend}
            disabled={disabled || (!messageInput.trim() && !pendingFile)}
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
