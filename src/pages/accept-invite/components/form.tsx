import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as yup from "yup";
import endpoint from "@/api/endpoint";
import { Dateinput, Textinput } from "@/components/Form";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import { cn, isEmpty } from "@/utility";
import type { IBeneficiary } from "@/utility/interface";
import AcceptInviteButtons from "./buttons";

const initialValues = {
  first_name: "",
  last_name: "",
  dob: "",
};

const schema = yup.object().shape({
  first_name: yup.string().required("Firstname is required").trim(),
  last_name: yup.string().required("Lastname is required").trim(),
  dob: yup.string().required("date of birth is required"),
});

export default function AcceptInviteForm({ data }: { data: IBeneficiary }) {
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(endpoint.acceptInvite);
  const { _id: inviteId, email, benefactor } = data;
  const name = benefactor?.first_name || benefactor?.last_name || benefactor?.email || "";

  const { getField, handleSubmit } = useForm({
    initial: initialValues,
    schema,
    async onSubmit(payload) {
      if (isMutating) return;
      const result = await trigger({ ...payload, invite_id: inviteId });
      if (result.success) {
        toast.success(result?.message);
        if (!isEmpty(result?.data?.token)) {
          navigate(`/set-password?token=${result?.data?.token}`);
        }
        navigate("/login");
      }
    },
  });

  return (
    <div className="w-full max-w-full space-y-5 rounded-3xl bg-white p-4 sm:max-w-[618px] sm:p-10">
      <div
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-full bg-grey-500 text-center sm:size-18",
          { "border-2 border-v3-stroke-weak": !isEmpty(benefactor.picture_url) },
        )}
      >
        {isEmpty(benefactor.picture_url) ? (
          <span className="font-geist text-2xl font-bold uppercase text-gray-800 sm:text-3xl">
            {(isEmpty(name.trim()) ? email : name)[0]}
          </span>
        ) : (
          <img
            width={64}
            height={64}
            src={benefactor.picture_url}
            alt={benefactor?.first_name || "Profile"}
            className="size-full rounded-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-garamond text-2xl font-medium text-gray-800 leading-[38px] sm:text-3xl">
          Join <span className="capitalize">{name}</span> on Memento AI
        </span>
        <span className="block max-w-[490px] font-garamond text-xs leading-6 text-v3-text-weak sm:text-xl">
          Your contact, <span className="capitalize">{name}</span> has invited you to join Memento as a beneficiary on his profile.{" "}
          <span className="cursor-pointer text-v3-brand-strong underline underline-offset-4">
            What does this mean?
          </span>
        </span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
        <span className="text-xs text-v3-text-weak sm:text-sm">You're Joining as:</span>
        <span className="mem-tags lowercase!">{email}</span>
      </div>

      {isEmpty(data?.user) ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <Textinput
              placeholder="Enter first name"
              label="first name"
              className="w-full"
              {...getField("first_name")}
            />
            <Textinput
              placeholder="Enter last name"
              label="last name"
              className="w-full"
              {...getField("last_name")}
            />
            <Dateinput
              placeholder="DD-MM-YY"
              label="date of birth"
              maxDate={dayjs().toDate()}
              className="w-full"
              {...getField("dob")}
            />
          </div>
          <div className="w-full space-y-4">
            <button type="submit" className="btn w-full">
              Accept invite
              <Spinner loading={isMutating} className="ml-2 mr-0! size-4!" />
            </button>
            <span className="mx-auto block max-w-[410.52px] text-center font-inter text-sm text-gray-800">
              By clicking “Accept invite” you agree to our
              <span className="cursor-pointer text-text-info-strong underline underline-offset-4"> Terms of Use</span> and
              <span className="cursor-pointer text-text-info-strong underline underline-offset-4"> Privacy Policy</span>.
            </span>
          </div>
        </form>
      ) : (
        <AcceptInviteButtons data={data} />
      )}
    </div>
  );
}

