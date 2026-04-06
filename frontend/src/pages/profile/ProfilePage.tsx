import { Loader2 } from "lucide-react";
import { useProfile } from "./hooks/useProfile";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileInfoCards } from "./components/ProfileInfoCards";
import { ChangePasswordForm } from "./components/ChangePasswordForm";

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack: _onBack }: ProfilePageProps) {
  const {
    profile,
    loading,
    editingName,
    setEditingName,
    nameInput,
    setNameInput,
    savingName,
    saveName,
    cancelEditName,
    uploadingAvatar,
    uploadAvatar,
    showPasswordForm,
    setShowPasswordForm,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    changePassword,
    cancelPasswordChange,
  } = useProfile();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading profile…</span>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 overflow-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="w-full px-6 py-4">
          <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-none">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your account details</p>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 w-full px-6 py-7 space-y-5">
        <ProfileHero
          profile={profile}
          editingName={editingName}
          nameInput={nameInput}
          savingName={savingName}
          uploadingAvatar={uploadingAvatar}
          onStartEdit={() => setEditingName(true)}
          onNameChange={setNameInput}
          onSaveName={saveName}
          onCancelEdit={cancelEditName}
          onAvatarUpload={uploadAvatar}
        />

        <ProfileInfoCards profile={profile} />

        <ChangePasswordForm
          show={showPasswordForm}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          saving={savingPassword}
          passwordChangedAt={profile.passwordChangedAt}
          onToggle={() => setShowPasswordForm(true)}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSave={changePassword}
          onCancel={cancelPasswordChange}
        />
      </div>
    </div>
  );
}
