import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { toast } from "sonner";
import * as yup from "yup";
import AuthLayout from "../components/layout";
import { TypographyMuted } from "@/components/ui/typography";

const schema = yup.object().shape({
  first_name: yup.string().required("First name is required").trim(),
  last_name: yup.string().required("Last name is required").trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
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
});

const initial = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { trigger, isMutating } = useFetcher(endpoint.register);

  const { handleSubmit, handleChange, values, errors } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result) {
        toast.success(result?.message);
      }
      navigate(`/verify-email?email=${payload.email}`);
    },
  });

  return (
    <AuthLayout
      title="Create account"
      include_auth_socials
      footer={
        <TypographyMuted className="text-center font-inter text-xs text-v3-text-weak">
          Already have an account?
          <Link
            to="/login"
            className="font-inter text-xs font-medium text-primary underline underline-offset-2"
          >
            {" "}
            Login
          </Link>
        </TypographyMuted>
      }
    >
      <Card className="rounded-none border-0 bg-transparent py-0 shadow-none ring-0">
        <CardContent className="w-full p-0">
          <form onSubmit={handleSubmit} className="box-content flex flex-col gap-3.5 px-0.5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 box-content">
                <Label htmlFor="register-first-name" className="font-inter text-sm">
                  First name
                </Label>
                <Input
                  id="register-first-name"
                  name="first_name"
                  placeholder="John"
                  className="rounded-[8px]"
                  value={values.first_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.first_name)}
                />
                {errors.first_name ? <p className="font-inter text-xs text-destructive">{errors.first_name}</p> : null}
              </div>
              <div className="grid gap-2 box-content">
                <Label htmlFor="register-last-name" className="font-inter text-sm">
                  Last name
                </Label>
                <Input
                  id="register-last-name"
                  name="last_name"
                  placeholder="Doe"
                  className="rounded-[8px]"
                  value={values.last_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.last_name)}
                />
                {errors.last_name ? <p className="font-inter text-xs text-destructive">{errors.last_name}</p> : null}
              </div>
            </div>

            <div className="grid gap-2 box-content">
              <Label htmlFor="register-email" className="font-inter text-sm">
                Email
              </Label>
              <Input
                id="register-email"
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

            <div className="grid gap-2 box-content">
              <Label htmlFor="register-password" className="font-inter text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  className="rounded-[8px] pr-11"
                  value={values.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-v3-text-weak transition-colors hover:bg-v3-fill-weaker hover:text-v3-text-strong"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ?
                    <EyeOff className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  : <Eye className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
                </button>
              </div>
              {errors.password ? <p className="font-inter text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <TypographyMuted className="px-1 text-center font-inter text-xs leading-5 text-v3-text-weak">
              By clicking "Create account" you agree to the{" "}
              <span className="text-xs font-medium text-primary underline">Terms of Use</span> and{" "}
              <span className="text-xs font-medium text-primary underline">Privacy Policy</span>
            </TypographyMuted>

            <Button type="submit" className="h-11 w-full rounded-[8px] bg-v3-brand-strong text-white hover:bg-v3-brand-strong/90" disabled={isMutating}>
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
