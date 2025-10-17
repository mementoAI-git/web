import useFetcher from "@/hooks/use-fetcher"
import useForm from "@/hooks/use-form"
import endpoint from "@/api/endpoint"
import { toast } from "sonner"
import * as yup from "yup"
import dayjs from "dayjs"
import Spinner from "@/components/Spinner"
import { cn, isEmpty } from "@/utility"
import { Dateinput, Textinput } from "@/components/Form"
import { useRouter } from "next/navigation";
import { IBeneficiary } from "@/utility/interface"
import Image from "next/image"
import AcceptInviteButtons from "./Butttons"

const initial = {
  first_name: "",
  last_name: "",
  dob: ""
}

const schema = yup.object().shape({
  first_name: yup.string().required("Firstname is required").trim(),
  last_name: yup.string().required("Lastname is required").trim(),
  dob: yup.string().required("date of birth is required")
});

export default function AcceptInviteForm({ data }: { data: IBeneficiary }) {
  const { _id: invite_id, email, benefactor } = data
  const name = benefactor?.first_name || benefactor?.last_name || benefactor?.email;

  const router = useRouter();
  const { trigger, isMutating } = useFetcher(endpoint.acceptInvite)
  const { getField, handleSubmit } = useForm({
    initial,
    schema,
    async onSubmit(p) {
      if (isMutating) return;
      const result = await trigger({ ...p, invite_id })
      if (result.success) {
        toast.success(result?.message)
        if (!isEmpty(result?.data?.token)) {
          router.push(`/set-password?token=${result?.data?.token}`);
        }
        router.push("/login")
      }
    },
  })
  return (
    <div className="w-full max-w-full sm:max-w-[618px] space-y-5 p-4 sm:p-10 rounded-3xl bg-white">
      <div className={cn("size-16 sm:size-18 bg-grey-500 flex justify-center items-center rounded-full overflow-hidden border-[#EAECF0] mx-auto", { "border-2": !isEmpty(benefactor.picture_url) })}>
        {
          isEmpty(benefactor.picture_url) ?
            <span className="uppercase font-bold font-geist text-2xl sm:text-3xl">{(isEmpty(name.trim()) ? email : name)[0]}</span> :
            <Image
              width={64}
              height={64}
              src={benefactor.picture_url}
              alt={benefactor?.first_name || "Profile pics"}
              className="size-full object-cover rounded-full"
            />
        }
      </div>
      <div className="flex flex-col gap-2 items-center text-center">
        <span className="font-medium text-2xl sm:text-3xl text-gray-800 font-garamond leading-[38px]">
          Join <span className="capitalize">{name}</span> on Memento AI
        </span>
        <span className="block text-xs sm:text-xl font-garamond leading-[24px] text-[#667085] max-w-[490px]">
          Your contact, <span className="capitalize">{name}</span> has invited you to join Memento as a beneficiary on his profile.{" "}
          <span className="text-[#E26A24] underline cursor-pointer underline-offset-3">What does this mean?</span>
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-[#667085]">You're Joining as:</span>
        <span className="mem-tags !lowercase">{email}</span>
      </div>
      {
        isEmpty(data?.user) ?
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
            <div className="gap-3 w-full space-y-4">
              <button type="submit" className="btn w-full">
                Accept invite
                {isMutating && <Spinner loading className="mr-2 !size-4" />}
              </button>
              <span className="text-center text-gray-800 font-inter block mx-auto max-w-[410.52px] text-sm">
                By clicking “Accept invite” you agree to our
                <span className="text-[#52A1DD] underline cursor-pointer underline-offset-3"> Terms of Use</span> and
                <span className="text-[#52A1DD] underline cursor-pointer underline-offset-3"> Privacy Policy</span>.</span>
            </div>
          </form> :
          <AcceptInviteButtons data={data} />
      }
    </div>
  )
}