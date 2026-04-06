import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../workspace/WorkspaceContext";
import UserPreferences from "../../users/UserPreferences";

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();

  return (
    <UserPreferences onBack={() => navigate(`/workspaces/${workspaceId}`)} />
  );
}
