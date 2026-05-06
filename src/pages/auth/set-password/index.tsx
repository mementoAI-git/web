"use client";

import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StrengthIndicator from "@/components/strength-indicator";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import AuthLayout from "../components/layout";

const schema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm password"),
});

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trigger, isMutating } = useFetcher(endpoint.setPassword);

  const token = searchParams.get("token") || "";
  const initial = { confirm_password: "", password: "", token };

  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        toast.success(result?.message);
        navigate("/login");
      }
    },
  });

  const level = useMemo(() => {
    let strength = 0;
    if (/[A-Z]/.test(values.password)) {
      strength += 1;
    }
    if (/[a-z]/.test(values.password)) {
      strength += 1;
    }
    if (/[0-9]/.test(values.password)) {
      strength += 1;
    }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(values.password)) {
      strength += 1;
    }
    if (values.password.length >= 8) {
      strength += 1;
    }

    return strength;
  }, [values.password]);

  useEffect(() => {
    if (!token) {
      navigate("/forget-password");
    }
  }, [token, navigate]);

  return (
    <AuthLayout
      title="Set new password"
      can_go_back
      subtitle="Your new password must be different from previously used passwords on this platform."
    >
      <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/20 py-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="set-password-new" className="font-inter text-sm">
                Password
              </Label>
              <Input
                id="set-password-new"
                name="password"
                type="password"
                placeholder="New password"
                className="rounded-[12px]"
                value={values.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                autoComplete="new-password"
              />
              {errors.password ? <p className="font-inter text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="set-password-confirm" className="font-inter text-sm">
                Confirm password
              </Label>
              <Input
                id="set-password-confirm"
                name="confirm_password"
                type="password"
                placeholder="Confirm password"
                className="rounded-[12px]"
                value={values.confirm_password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirm_password)}
                autoComplete="new-password"
              />
              {errors.confirm_password ?
                <p className="font-inter text-xs text-destructive">{errors.confirm_password}</p>
              : null}
            </div>

            <StrengthIndicator level={level} />

            <Button type="submit" className="mt-1 h-11 w-full rounded-full" disabled={isMutating}>
              {isMutating ?
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              : "Set new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
