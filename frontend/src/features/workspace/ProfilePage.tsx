import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../workspace/WorkspaceContext";
import UserProfile from "../../users/UserProfile";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();

  return (
    <UserProfile onBack={() => navigate(`/workspaces/${workspaceId}`)} />
  );
}
