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
import AuthLayout from "../components/layout";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  type: yup.string().default("reset"),
});

const initial = { email: "", type: "reset" };

export default function ForgetPasswordPage() {
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(endpoint.sendLink);
  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        navigate(`/check-mail?email=${payload.email}`);
      }
    },
  });

  return (
    <AuthLayout
      title="Forgot Password"
      can_go_back
      subtitle="Please enter your email address. We will send instructions to reset your password if this email exists in our system."
    >
      <Card className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="w-full p-0">
          <form onSubmit={handleSubmit} className="box-content flex flex-col gap-3.5">
            <div className="grid gap-2 box-content">
              <Label htmlFor="forget-password-email" className="font-inter text-sm">
                Email
              </Label>
              <Input
                id="forget-password-email"
                name="email"
                type="email"
                placeholder="johndoe@mail.com"
                className="rounded-[8px]"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="font-inter text-xs text-destructive">{errors.email}</p> : null}
            </div>

            <Button type="submit" className="h-11 w-full rounded-[8px] bg-v3-brand-strong text-white hover:bg-v3-brand-strong/90" disabled={isMutating}>
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
