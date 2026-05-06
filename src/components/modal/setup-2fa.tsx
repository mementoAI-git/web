import { useState } from "react";
import * as yup from "yup";
import { Sheet } from "react-modal-sheet";
import { toast } from "sonner";
import { ModalCloseBtn } from "./modalLayout";
import { useModal } from "@/hooks/use-modal";
import { Textinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
import { mutate } from "swr";
import { CopyIcon } from "@/components/icons";

const initial = { token: "" };

const schema = yup.object().shape({
  token: yup.string().required("Token is required").length(6, "Invalid token").trim(),
});

interface Setup2FAContentProps {
  data: { qrcode: string; secret: string };
}

function Content({ data }: Setup2FAContentProps) {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.verifyTOTP);
  const [showSecret, setShowSecret] = useState(false);

  const { values, errors, handleValue, handleChange, handleSubmit } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result?.status) {
        toast.success(result?.message);
        close?.("setup2fa");
        mutate(endpoint.profile);
      }
    },
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleValue("token", text);
    } catch {
      toast.error("Failed to paste");
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(data.secret);
      toast.success("Secret code copied to clipboard");
    } catch {
      toast.error("Failed to copy secret code");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="modal-title !text-gray-800">Setup 2FA</h3>
      <div className="space-y-3 font-inter">
        <h4 className="leading-6 font-medium text-gray-950/90">Step 1:</h4>
        <span className="inline-block text-gray-950/70">Download the 2FA apps</span>
        <ol className="list-inside list-decimal text-v3-brand-strong">
          <li>Google Authenticator</li>
          <li>Authy.</li>
        </ol>
      </div>
      <div className="space-y-3 font-inter">
        <h4 className="leading-6 font-medium text-gray-950/90">Step 2:</h4>
        <span className="inline-block text-gray-950/70">
          Scan the QR code below to pair Memento with your authenticator app. Cannot scan the QR code?
          <button
            type="button"
            className="ml-1 inline-block text-base font-bold text-[#4284B6] hover:underline"
            onClick={() => setShowSecret((previous) => !previous)}
          >
            {showSecret ? "Show QR code" : "Add Secret code manually"}
          </button>
        </span>
        {!showSecret ? (
          <div className="size-56 overflow-hidden rounded-lg border border-[#0011661A]">
            <img src={data.qrcode} alt="Setup QR code" className="size-full object-cover" />
          </div>
        ) : (
          <div className="space-y-2 rounded-lg bg-grey-400 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-950/90">Secret Code:</span>
              <button
                type="button"
                onClick={handleCopySecret}
                className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
              >
                <CopyIcon width={16} height={16} />
                <span className="text-sm font-medium">Copy</span>
              </button>
            </div>
            <div className="overflow-hidden rounded border p-2 font-mono text-sm break-all">
              {data.secret}
            </div>
            <p className="text-xs text-grey-600">
              Enter this code manually in your authenticator app if you can&apos;t scan the QR code.
            </p>
          </div>
        )}
      </div>
      <div className="space-y-3 font-inter">
        <h4 className="leading-6 font-medium text-gray-950/90">Step 3:</h4>
        <span className="inline-block text-gray-950/70">
          Copy and paste the 6-digit code from your authenticator app below:
        </span>
        <Textinput
          name="token"
          value={values.token}
          error={errors.token}
          onChange={handleChange}
          placeholder="673528"
          end={
            <button
              type="button"
              onClick={handlePaste}
              className="cursor-pointer font-inter text-sm font-semibold text-blue-6"
            >
              Paste code
            </button>
          }
        />
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        <button type="button" onClick={() => close?.("setup2fa")} className="btn-outline">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className="btn !bg-gray-950/90">
          <span>Complete setup</span>
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </div>
  );
}

interface Setup2FAProps {
  data: { qrcode: string; secret: string };
}

export default function Setup2FA({ data }: Setup2FAProps) {
  const { close } = useModal();

  return (
    <div>
      <div className="modal-container hidden !min-w-[618px] sm:block">
        <ModalCloseBtn onClick={() => close?.("setup2fa")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close?.("setup2fa")}
        snapPoints={[0, 0.8]}
        initialSnap={1}
      >
        <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-white">
          <Sheet.Header className="rounded-3xl bg-white" />
          <Sheet.Content className="max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain bg-white px-4 pb-6">
            <ModalCloseBtn
              className="!relative ml-auto mb-2 !right-0 !top-0"
              onClick={() => close?.("setup2fa")}
            />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}

