import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UpgradePrompt } from "./upgrade-prompt";

export function VoiceModePaywall({ conversationId }: { conversationId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <>
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
      />
    </>
  );
}
