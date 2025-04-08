import { mutate } from "swr"

export const hashEmail = (email: string) => {
  const [username, domain] = email.split("@")
  return username.slice(0, 5) + "***@" + domain
}

export const openMailBox = (email: string) => {
  "use client";

  let link = ""
  if (email.endsWith("gmail.com")) {
    link = "https://mail.google.com/mail/u/0/#inbox"
  } else if (email.endsWith("yahoo.com")) {
    link = "https://mail.yahoo.com/"
  } else if (email.endsWith("outlook.com")) {
    link = "https://outlook.live.com/mail/inbox"
  } else link = `mailto:${email}`

  window.open(link, "_blank")
  return link
}

export const clearCache = () => mutate(
  () => true,
  undefined,
  { revalidate: false }
)

export const isEmpty = (mixedVar: any) => {
  let undef;
  let key;
  let i;
  let len;
  const emptyValues = [undef, null, false, 0, '', '0', 'null', 'undefined'];

  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i] || typeof mixedVar === 'undefined') {
      return true;
    }
  }

  if (typeof mixedVar === 'object' && !(mixedVar instanceof Date)) {
    for (key in mixedVar) {
      if (Object.prototype.hasOwnProperty.call(mixedVar, key)) {
        return false;
      }
    }
    return true;
  }
  return false;
};