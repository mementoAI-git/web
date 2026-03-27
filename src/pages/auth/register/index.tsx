import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/Buttons";
import { Passwordinput, Textinput } from "@/components/Form";
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

  const { handleSubmit, getField } = useForm({
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 sm:flex-row w-full sm:items-center justify-between sm:gap-3">
          <div className="flex-1 w-full">
            <Textinput
              label="First name"
              placeholder="John"
              className="flex-1"
              {...getField("first_name")}
            />
          </div>
          <div className="flex-1 w-full">
            <Textinput
              label="Last name"
              placeholder="Doe"
              {...getField("last_name")}
            />
          </div>
        </div>
        <Textinput
          label="Email"
          placeholder="johndoe@mail.com"
          {...getField("email")}
        />

        <Passwordinput label="Password" {...getField("password")} />
        <Button
          loading={isMutating}
          type="submit"
          title="Create account"
          className="mt-3 !rounded-full"
        />

        <small className="px-3 text-center font-inter text-sm leading-5 text-gray-800">
          By clicking "Create account" you agree to the
          <span className="text-primary underline">Terms of Use</span> and
          <span className="text-primary underline"> Privacy Policy</span>
        </small>
      </form>
    </AuthLayout>
  );
}
