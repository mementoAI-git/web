"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import * as yup from "yup";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import AuthEntryLayout from "../components/entry-layout";

const schema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
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
        navigate("/login", { replace: true, state: { passwordReset: true } });
      }
    },
  });

  const [visible, setVisible] = useState({
    password: false,
    confirm_password: false,
  });

  useEffect(() => {
    if (!token) {
      navigate("/forget-password");
    }
  }, [token, navigate]);

  return (
    <AuthEntryLayout
      title={
        <>
          Enter a new <em>password</em>
        </>
      }
      recovery
      subtitle="Enter your new password to finish off the process."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {(["password", "confirm_password"] as const).map((name) => (
          <div key={name} className="grid gap-1.5">
            <Label htmlFor={`set-${name}`} className="text-sm">
              {name === "password" ? "New password" : "Confirm password"}
            </Label>
            <div className="relative">
              <Input
                id={`set-${name}`}
                name={name}
                type={visible[name] ? "text" : "password"}
                placeholder={
                  name === "password" ? "New password" : "Confirm password"
                }
                className="rounded-lg pr-11"
                value={values[name]}
                onChange={handleChange}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={
                  errors[name]
                    ? `${name}-error`
                    : name === "password"
                      ? "password-help"
                      : undefined
                }
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-icon-neutral-weak hover:bg-fill-neutral-weaker"
                aria-label={`${visible[name] ? "Hide" : "Show"} ${name === "password" ? "new password" : "confirm password"}`}
                aria-pressed={visible[name]}
                onClick={() =>
                  setVisible((current) => ({
                    ...current,
                    [name]: !current[name],
                  }))
                }
              >
                {visible[name] ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
            {name === "password" && (
              <p
                id="password-help"
                className="text-xs leading-[18px] text-text-neutral-weak"
              >
                At least 8 characters containing uppercase and lowercase
                letters, a number, and a symbol.
              </p>
            )}
            {errors[name] && (
              <p
                id={`${name}-error`}
                className="text-xs text-text-error-strong"
              >
                {errors[name]}
              </p>
            )}
          </div>
        ))}
        <Button
          type="submit"
          className="h-11 w-full rounded-lg"
          disabled={isMutating}
        >
          {isMutating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthEntryLayout>
  );
}
