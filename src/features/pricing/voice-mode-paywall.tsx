import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UpgradePrompt } from "./upgrade-prompt";

export function VoiceModePaywall({ conversationId }: { conversationId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center px-4">
      <p className="mb-4 text-center font-inter text-sm text-v3-text-weak">
        Voice mode requires an upgraded plan.
      </p>
      <UpgradePrompt
        feature="voice_mode"
        variant="modal"
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            navigate(`/chat/${conversationId}`, { replace: true });
          }
        }}
        onDismiss={() => navigate(`/chat/${conversationId}`, { replace: true })}
        onUpgrade={() => {
          navigate("/pricing");
        }}
      />
    </div>
  );
}
