import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../workspace/WorkspaceContext";
import Notifications from "../../users/Notifications";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { workspaceId } = useWorkspace();

  return (
    <Notifications onBack={() => navigate(`/workspaces/${workspaceId}`)} />
  );
}
