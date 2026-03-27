import { Link, useNavigate, useSearchParams } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Checkbox, Passwordinput, Textinput } from "@/components/Form";
import useForm from "@/hooks/use-form";
import useFetcher from "@/hooks/use-fetcher";
import { clearCache } from "@/utility";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";
import * as yup from "yup";
import AuthLayout from "../components/layout";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
  password: yup.string().required("Password is required"),
  remember_for_30_days: yup.boolean().default(false),
});

const initial = {
  email: "",
  password: "",
  remember_for_30_days: false,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useStore();
  const { trigger, isMutating } = useFetcher(endpoint.login);
  const { handleSubmit, handleChange, values, getField } = useForm({
    schema,
    initial,
    async onSubmit(payload) {
      try {
        const result = await trigger(payload);
        if (result?.data) {
          toast.success(result?.message);
          setAuth?.(result.data);

          await clearCache();

          const redirectPath = searchParams.get("redirect");

          if (redirectPath && result?.data?.onboarded) {
            navigate(decodeURIComponent(redirectPath));
          } else {
            navigate(result?.data?.onboarded ? "/overview" : "/onboard");
          }
        }
      } catch (err: any) {
        if (err && err.data?.requires_verification) {
          navigate(`/verify-email?email=${payload.email}`);
        }
      }
    },
  });

  return (
    <AuthLayout
      title="Login to continue"
      subtitle="Welcome back. Login to access your account"
      include_auth_socials
      footer={
        <span className="font-inter text-center text-gray-600">
          New user?
          <Link
            to="/register"
            className="font-inter text-sm font-bold text-blue-6 underline"
          >
            {" "}
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Textinput
          label="Email"
          placeholder="johndoe@mail.com"
          {...getField("email")}
          value={values.email}
        />
        <Passwordinput
          label="Password"
          {...getField("password")}
          value={values.password}
        />

        <div className="flex items-center justify-between font-inter text-sm">
          <Checkbox
            label="Remember for 30 days"
            name="remember_for_30_days"
            checked={values.remember_for_30_days}
            onChange={handleChange}
          />
          <Link to="/forget-password" className="cursor-pointer font-bold text-primary">
            Forgot password?
          </Link>
        </div>
        <Button
          loading={isMutating}
          type="submit"
          title="Login"
          className="mt-3 !rounded-full"
        />
      </form>
    </AuthLayout>
  );
}

