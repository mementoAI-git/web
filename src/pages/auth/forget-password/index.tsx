import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import * as yup from "yup";
import AuthEntryLayout from "../components/entry-layout";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
});

const initial = { email: "" };

export default function ForgetPasswordPage() {
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(endpoint.sendRecoveryCode);
  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        navigate(`/check-mail?email=${encodeURIComponent(payload.email)}`, {
          state: { recoverySentAt: Date.now() },
        });
      }
    },
  });

  return (
    <AuthEntryLayout
      title={
        <>
          Forgot <em>password</em>
        </>
      }
      recovery
      subtitle="Forgot your current password? Enter your email address and we’ll send a 6-digit code to help you reset it."
    >
      <Card className="overflow-visible rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="w-full p-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2 box-content">
              <Label
                htmlFor="forget-password-email"
                className="font-geist text-sm"
              >
                Email
              </Label>
              <Input
                id="forget-password-email"
                name="email"
                type="email"
                placeholder="janedoe@mail.com"
                autoComplete="email"
                className="rounded-[8px]"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="font-geist text-xs text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-[8px] bg-fill-brand-strong text-text-inverse-strong hover:opacity-90"
              disabled={isMutating}
            >
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send code"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthEntryLayout>
  );
}
