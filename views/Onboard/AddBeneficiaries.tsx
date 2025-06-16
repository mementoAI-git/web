import endpoint from "@/api/endpoint";
import { Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address")
    .trim(),
});

const initial = { email: "" };

export default function AddBeneficiaries() {
  const { trigger, isMutating } = useFetcher(endpoint.beneficiaries);
  const { handleSubmit, handleChange, values, errors } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      trigger({ ...p, relationship: "friend" })
    },
  });
  return (
    <form onSubmit={handleSubmit} className="">
      <label htmlFor="email" className="input-label">
        Email
      </label>
      <div className="flex flex-row gap-1">
        <div className="w-full flex-3">
          <Textinput
            name="email"
            type="email"
            id="email"
            placeholder="example@yahoo.com"
            className="!mt-0"
            onChange={handleChange}
            value={values.email}
            error={errors.email}
          />
        </div>
        <button className="flex h-[40px] min-w-[129px] flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/80 px-4 text-center">
          <span className="text-center font-geist font-bold whitespace-nowrap text-primary">
            Send invite
          </span>
          <Spinner loading={isMutating} className="!text-primary" />
        </button>
      </div>
    </form>
  );
}
