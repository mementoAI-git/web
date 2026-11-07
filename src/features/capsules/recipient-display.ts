import type { ICapsule, IUser } from "@/utility/interface";

export function getCapsuleDisplayRecipients(
  capsule: Pick<ICapsule, "recipients" | "recipient_snapshots">,
): Array<Partial<IUser> & { email: string }> {
  if (capsule.recipient_snapshots?.length) {
    return capsule.recipient_snapshots.map((recipient) => ({
      _id: recipient.linked_user_id,
      email: recipient.email,
      first_name: recipient.display_name || recipient.email.split("@")[0],
    }));
  }
  return (capsule.recipients || []) as Array<Partial<IUser> & { email: string }>;
}
