import { useState, type ChangeEvent } from "react";
import * as yup from "yup";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import { ModalWrapper } from "../modalLayout";
import useForm from "@/hooks/use-form";
import { useFileUploadFetcher } from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { Selectinput, Textinput } from "@/components/Form";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { email?: string } | null;
}

const schema = yup.object().shape({
  type: yup.string().required(),
  message: yup.string().required("Message is required"),
  severity: yup.string().when("type", {
    is: "Bug",
    then: (schema) => schema.required("Severity is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  reproSteps: yup.string().when("type", {
    is: "Bug",
    then: (schema) => schema.required("Reproduction steps are required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  email: yup.string().email("Invalid email address"),
  screenshot: yup.mixed().nullable(),
});

export function FeedbackModal({ isOpen, onClose, user }: FeedbackModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const { trigger: uploadFile, isMutating } = useFileUploadFetcher(endpoint.feedback);

  const { values, errors, getField, handleSubmit, setValues } = useForm({
    initial: {
      type: "Bug",
      message: "",
      severity: "Minor",
      reproSteps: "",
      email: user?.email || "",
      screenshot: null as File | null,
    },
    schema,
    async onSubmit(payload) {
      const context = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        loggedIn: !!user,
      };

      const result = await uploadFile({ ...payload, context: JSON.stringify(context) });

      if (result?.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 1500);
      } else {
        toast.error(result?.message || "Failed to send feedback.");
      }
    },
  });

  const handleScreenshot = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValues((prev) => ({ ...prev, screenshot: file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay z-50 bg-[rgba(94,94,94,0.5)] flex">
      <ModalWrapper onClose={onClose}>
        <div className="!max-w-[520px]">
          {submitted ? (
            <div className="flex flex-col items-center py-10">
              <div className="text-5xl mb-4">🎉</div>
              <h4 className="modal-title text-center">Thank you!</h4>
              <p className="font-inter text-sm text-grey-600 mt-2">
                Your feedback has been sent successfully.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <h4 className="modal-title">Send Feedback</h4>

              <Selectinput
                label="Type"
                data={[
                  { label: "Bug", value: "Bug" },
                  { label: "Feature Request", value: "Feature Request" },
                  { label: "UI/UX Issue", value: "UI/UX Issue" },
                  { label: "General Feedback", value: "General Feedback" },
                  { label: "Other", value: "Other" },
                ]}
                {...getField("type")}
              />

              <div className="input-container">
                <label className="input-label">Message</label>
                <textarea
                  required
                  placeholder="Tell us what happened…"
                  {...getField("message")}
                  className="input-base w-full font-inter text-sm !h-24"
                />
                {errors.message && <small className="text-xs text-danger">{errors.message}</small>}
              </div>

              {values.type === "Bug" && (
                <>
                  <Selectinput
                    label="Severity"
                    data={[
                      { label: "Minor", value: "Minor" },
                      { label: "Moderate", value: "Moderate" },
                      { label: "Major", value: "Major" },
                      { label: "Critical", value: "Critical" },
                    ]}
                    {...getField("severity")}
                  />
                  <div className="input-container">
                    <label className="input-label">Repro Steps</label>
                    <textarea
                      placeholder="How did this happen?"
                      {...getField("reproSteps")}
                      className="input-base w-full font-inter text-sm !h-20"
                    />
                    {errors.reproSteps && <small className="text-xs text-danger">{errors.reproSteps}</small>}
                  </div>
                </>
              )}

              {!user && (
                <Textinput
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  {...getField("email")}
                />
              )}

              <div className="input-container">
                <label className="input-label">Screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshot}
                  className="w-full font-inter text-sm text-grey-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sand-2 file:text-sand-10 hover:file:bg-sand-3 file:cursor-pointer"
                />
                {values.screenshot && (
                  <span className="font-inter text-xs text-grey-600 mt-1">
                    Selected: {values.screenshot.name}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating || !values.message.trim()}
                  className="btn"
                >
                  <span>Send Feedback</span>
                  <Spinner loading={isMutating} className="!size-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </ModalWrapper>
    </div>
  );
}

