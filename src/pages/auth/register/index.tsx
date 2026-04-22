import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
      subtitle="Create a new account on Memento to start crafting your stories."
      include_auth_socials
      footer={
        <span className="font-inter text-center text-gray-600">
          Already have an account?
          <Link
            to="/login"
            className="font-inter text-sm font-bold text-blue-6 underline"
          >
            {" "}
            Login
          </Link>
        </span>
      }
    >
      <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/20 py-0">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="register-first-name" className="font-inter text-sm">
                  First name
                </Label>
                <Input
                  id="register-first-name"
                  name="first_name"
                  placeholder="John"
                  value={values.first_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.first_name)}
                />
                {errors.first_name ? <p className="font-inter text-xs text-destructive">{errors.first_name}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-last-name" className="font-inter text-sm">
                  Last name
                </Label>
                <Input
                  id="register-last-name"
                  name="last_name"
                  placeholder="Doe"
                  value={values.last_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.last_name)}
                />
                {errors.last_name ? <p className="font-inter text-xs text-destructive">{errors.last_name}</p> : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-email" className="font-inter text-sm">
                Email
              </Label>
              <Input
                id="register-email"
                name="email"
                type="email"
                placeholder="johndoe@mail.com"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <p className="font-inter text-xs text-destructive">{errors.email}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="register-password" className="font-inter text-sm">
                Password
              </Label>
              <Input
                id="register-password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                value={values.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <p className="font-inter text-xs text-destructive">{errors.password}</p> : null}
            </div>

            <Button type="submit" className="mt-1 w-full rounded-full" disabled={isMutating}>
              {isMutating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <small className="px-1 text-center font-inter text-sm leading-5 text-gray-800">
              By clicking "Create account" you agree to the{" "}
              <span className="text-primary underline">Terms of Use</span> and{" "}
              <span className="text-primary underline">Privacy Policy</span>
            </small>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
