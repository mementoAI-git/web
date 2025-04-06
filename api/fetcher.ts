import { Fetcher, MutationFetcher } from "./interface";
import { toast } from 'sonner';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

export const fetcher: Fetcher = (...args) => fetch(...args).then(res => res.json())

export const getFetcher: MutationFetcher = async (url, body) => {
  const res = await fetch(`${baseUrl}${url}`, {
    method: "GET",
    headers: { 'Content-Type': 'application/json' }
  })
  const result = await res.json()
  return result
}

export const postFetcher: MutationFetcher = async (url, body) => {
  const res = await fetch(`${baseUrl}${url}`, {
    body: JSON.stringify(body.arg),
    method: "POST",
    headers: { 'Content-Type': 'application/json' }
  })
  const result = await res.json()
  if (res.ok) {
    toast.success(result?.message, { className: "!text-success" })
  } else {
    toast.error(result?.message, { className: "!text-danger" })
  }
  return result
}

export const putFetcher: MutationFetcher = async (url, body) => {
  const res = await fetch(`${baseUrl}${url}`, {
    body: JSON.stringify(body.arg),
    method: "PUT",
    headers: { 'Content-Type': 'application/json' }
  })

  const result = await res.json()
  if (res.ok) {
    toast.success(result?.message, { className: "!text-success" })
  } else {
    toast.error(result?.message, { className: "!text-danger" })
  }
  return result
}

export const deleteFetcher: MutationFetcher = async (url, body) => {
  const res = await fetch(`${baseUrl}${url}`, {
    body: JSON.stringify(body.arg),
    method: "DELETE",
    headers: { 'Content-Type': 'application/json' }
  })
  const result = await res.json()
  if (res.ok) {
    toast.success(result?.message, { className: "!text-success" })
  } else {
    toast.error(result?.message, { className: "!text-danger" })
  }
  return result
}