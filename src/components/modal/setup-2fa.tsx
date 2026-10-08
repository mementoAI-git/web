import { useLocation } from "react-router-dom";
import { isSkyCardPage } from "@/pages/dashboard/component/sky-card-page";
import { useId, useState } from "react";
import * as yup from "yup";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { useModal } from "@/hooks/use-modal";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const initial = { token: "" };
const schema = yup.object().shape({
  token: yup
    .string()
    .required("Enter your verification code")
    .length(6, "Enter a 6-digit code")
    .trim(),
});

interface Setup2FAProps {
  data: { qrcode: string; secret: string };
}

export default function Setup2FA({ data }: Setup2FAProps) {
  const { pathname } = useLocation();
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(endpoint.verifyTOTP);
  const [showSecret, setShowSecret] = useState(false);
  const id = useId();
  const codeId = `${id}-code`;
  const secretId = `${id}-secret`;
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
      handleValue("token", (await navigator.clipboard.readText()).trim());
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close?.("setup2fa");
      }}
    >
      <DialogContent
        data-sky-card-page={isSkyCardPage(pathname) ? "" : undefined}
        aria-describedby={undefined}
        className="sky-card flex w-[calc(100vw_-_2rem)] max-h-[calc(100dvh_-_2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px] motion-reduce:animate-none"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-5 pr-12">
          <DialogTitle>Set up two-factor authentication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
            <FieldGroup className="gap-6">
              <Field className="gap-2">
                <FieldTitle>1. Choose an authenticator</FieldTitle>
                <FieldDescription>
                  Use Google Authenticator, Authy, or another authenticator app.
                </FieldDescription>
              </Field>
              <Field className="gap-3">
                <FieldTitle>2. Pair your app</FieldTitle>
                {!showSecret ? (
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    {/* A light QR canvas is intentional in every theme for reliable scanning. */}
                    <div className="sky-card size-44 shrink-0 rounded-xl border border-stroke-neutral-weak bg-white p-2">
                      <img
                        src={data.qrcode}
                        alt="Authenticator setup QR code"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col items-center gap-3 sm:items-start">
                      <FieldDescription>
                        Scan this QR code in your authenticator app.
                      </FieldDescription>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto whitespace-normal px-0"
                        onClick={() => setShowSecret(true)}
                      >
                        Can’t scan? Enter a setup key
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Field className="gap-2">
                    <FieldLabel htmlFor={secretId}>Setup key</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id={secretId}
                        value={data.secret}
                        readOnly
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          onClick={handleCopySecret}
                          aria-label="Copy setup key"
                        >
                          <Copy data-icon="inline-start" /> Copy
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Enter this key manually in your app.
                    </FieldDescription>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setShowSecret(false)}
                    >
                      Show QR code
                    </Button>
                  </Field>
                )}
              </Field>
              <Field data-invalid={Boolean(errors.token)} className="gap-2">
                <FieldLabel htmlFor={codeId}>
                  3. Enter your verification code
                </FieldLabel>
                <FieldDescription id={`${codeId}-hint`}>
                  Enter the 6-digit code from your authenticator app.
                </FieldDescription>
                <InputGroup className="h-11">
                  <InputGroupInput
                    id={codeId}
                    name="token"
                    value={values.token}
                    onChange={handleChange}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    aria-invalid={Boolean(errors.token)}
                    aria-describedby={`${codeId}-hint${errors.token ? ` ${codeId}-error` : ""}`}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton onClick={handlePaste}>
                      Paste code
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {errors.token ? (
                  <FieldError id={`${codeId}-error`}>{errors.token}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
          </div>
          <Separator />
          <DialogFooter className="shrink-0 p-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => close?.("setup2fa")}
              className="motion-safe:active:scale-[0.97]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isMutating}
              className="motion-safe:active:scale-[0.97]"
            >
              {isMutating ? <Spinner data-icon="inline-start" /> : null}
              Complete setup
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
