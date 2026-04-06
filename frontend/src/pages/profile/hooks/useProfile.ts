import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import userService from "../../../services/user.service";
import type { UserProfile } from "../../../services/user.service";

export function useProfile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.getMe();
        setProfile(data);
        setNameInput(data.fullName);
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === profile?.fullName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await userService.updateMe({ fullName: nameInput.trim() });
      setProfile(updated);
      setEditingName(false);
      updateUser({ fullName: updated.fullName });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const cancelEditName = () => {
    setEditingName(false);
    setNameInput(profile?.fullName ?? "");
  };

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const updated = await userService.uploadAvatar(file);
      setProfile(updated);
      updateUser({ avatarUrl: updated.avatarUrl });
      toast.success("Profile picture updated");
    } catch {
      toast.error("Failed to update profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword(newPassword);
      // Re-fetch profile to get updated passwordChangedAt
      const updated = await userService.getMe();
      setProfile(updated);
      toast.success("Password changed successfully");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowPasswordForm(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return {
    profile,
    loading,
    // Name
    editingName,
    setEditingName,
    nameInput,
    setNameInput,
    savingName,
    saveName,
    cancelEditName,
    // Avatar
    uploadingAvatar,
    uploadAvatar,
    // Password
    showPasswordForm,
    setShowPasswordForm,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    changePassword,
    cancelPasswordChange,
  };
}
