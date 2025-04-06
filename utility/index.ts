
export const hashEmail = (email: string) => {
  const [username, domain] = email.split("@")
  return username.slice(0, 5) + "***@" + domain
}

export const openMailBox = (email: string) => {
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