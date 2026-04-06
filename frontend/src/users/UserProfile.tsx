import ProfilePage from "../pages/profile/ProfilePage";

interface UserProfileProps {
  onBack: () => void;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  return <ProfilePage onBack={onBack} />;
}
