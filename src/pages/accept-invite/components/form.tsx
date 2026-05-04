import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as yup from "yup";
import endpoint from "@/api/endpoint";
import { Dateinput } from "@/components/Form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const { getField, handleSubmit, handleChange, values, errors } = useForm({
    initial: initialValues,
    schema,
    async onSubmit(payload) {
      if (isMutating) return;
      const result = await trigger({ ...payload, invite_id: inviteId });
      if (result.success) {
        toast.success(result?.message);
        if (!isEmpty(result?.data?.token)) {
          navigate(`/set-password?token=${result?.data?.token}`);
          return;
        }
        navigate("/login");
      }
    },
  });

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8">
      <div
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-full bg-v3-fill-weaker text-center sm:size-20",
          { "ring-2 ring-v3-stroke-weak": !isEmpty(benefactor.picture_url) },
        )}
      >
        {isEmpty(benefactor.picture_url) ?
          <span className="font-geist text-2xl font-bold uppercase text-v3-text-strong sm:text-3xl">
            {(isEmpty(name.trim()) ? email : name)[0]}
          </span>
        : <img
            width={64}
            height={64}
            src={benefactor.picture_url}
            alt={benefactor?.first_name || "Profile"}
            className="size-full rounded-full object-cover"
          />
        }
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-garamond text-2xl font-medium leading-snug text-v3-text-strong sm:text-3xl sm:leading-[1.2]">
          Join <span className="capitalize">{name}</span> on Memento
        </h1>
        <p className="max-w-[490px] font-inter text-sm leading-relaxed text-v3-text-weak sm:text-base">
          Your contact, <span className="capitalize">{name}</span>, invited you to join Memento as a beneficiary on their profile.{" "}
          <span className="cursor-pointer font-medium text-primary underline underline-offset-4">
            What does this mean?
          </span>
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
        <span className="text-xs text-v3-text-weak sm:text-sm">You&apos;re joining as:</span>
        <span className="mem-tags lowercase!">{email}</span>
      </div>

      {isEmpty(data?.user) ?
        <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="invite-first-name" className="font-inter text-sm">
                  First name
                </Label>
                <Input
                  id="invite-first-name"
                  name="first_name"
                  placeholder="Enter first name"
                  className="rounded-[12px]"
                  value={values.first_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.first_name)}
                />
                {errors.first_name ?
                  <p className="font-inter text-xs text-destructive">{errors.first_name}</p>
                : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-last-name" className="font-inter text-sm">
                  Last name
                </Label>
                <Input
                  id="invite-last-name"
                  name="last_name"
                  placeholder="Enter last name"
                  className="rounded-[12px]"
                  value={values.last_name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.last_name)}
                />
                {errors.last_name ?
                  <p className="font-inter text-xs text-destructive">{errors.last_name}</p>
                : null}
              </div>
              <Dateinput
                placeholder="DD-MM-YY"
                label="Date of birth"
                maxDate={dayjs().toDate()}
                className="w-full"
                {...getField("dob")}
              />
              <Button type="submit" className="h-11 w-full rounded-full" disabled={isMutating}>
                {isMutating ?
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Accepting...
                  </>
                : "Accept invite"}
              </Button>
              <p className="text-center font-inter text-sm leading-relaxed text-v3-text-weak">
                By clicking &quot;Accept invite&quot; you agree to our{" "}
                <span className="cursor-pointer text-primary underline underline-offset-2">Terms of Use</span> and{" "}
                <span className="cursor-pointer text-primary underline underline-offset-2">Privacy Policy</span>.
              </p>
            </form>
          </CardContent>
        </Card>
      : <AcceptInviteButtons data={data} />}
    </div>
  );
}
