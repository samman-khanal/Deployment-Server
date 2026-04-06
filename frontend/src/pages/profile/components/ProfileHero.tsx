import { useRef } from "react";
import { Camera, Check, Loader2, Pencil, Shield, X } from "lucide-react";
import type { UserProfile } from "../../../services/user.service";

interface ProfileHeroProps {
  profile: UserProfile;
  editingName: boolean;
  nameInput: string;
  savingName: boolean;
  uploadingAvatar: boolean;
  onStartEdit: () => void;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEdit: () => void;
  onAvatarUpload: (file: File) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ProfileHero({
  profile,
  editingName,
  nameInput,
  savingName,
  uploadingAvatar,
  onStartEdit,
  onNameChange,
  onSaveName,
  onCancelEdit,
  onAvatarUpload,
}: ProfileHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Clean solid header bar */}
      <div className="h-24 bg-slate-100 dark:bg-slate-700/50" />

      <div className="px-7 pb-7 -mt-14">
        {/* Avatar */}
        <div className="relative w-28 h-28 mb-5">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.fullName}
              className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-4 ring-white dark:ring-slate-800"
            />
          ) : (
            <div className="w-28 h-28 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-semibold text-3xl shadow-lg ring-4 ring-white dark:ring-slate-800">
              {getInitials(profile.fullName)}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-2 -right-2 w-9 h-9 bg-white dark:bg-slate-700 border-2 border-white dark:border-slate-800 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-all group disabled:opacity-60"
            title="Change profile picture"
          >
            {uploadingAvatar
              ? <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300 group-hover:text-indigo-500 transition-colors" />
            }
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAvatarUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Name row */}
        <div className="flex items-center gap-2 mb-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => onNameChange(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveName();
                  if (e.key === "Escape") onCancelEdit();
                }}
                className="text-xl font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700 border border-indigo-300 dark:border-indigo-500 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
              />
              <button
                onClick={onSaveName}
                disabled={savingName}
                className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-sm"
              >
                {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onCancelEdit}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight">
                {profile.fullName}
              </h2>
              <button
                onClick={onStartEdit}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                title="Edit name"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* Role badge + email */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full capitalize border border-indigo-100 dark:border-indigo-800">
            <Shield className="w-3.5 h-3.5" />
            {profile.role}
          </span>
          <span className="text-base text-slate-500 dark:text-slate-400">{profile.email}</span>
        </div>
      </div>
    </div>
  );
}

