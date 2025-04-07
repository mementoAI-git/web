
export interface IResponse {
  message: string
  data?: any
  status: number
}
export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<IResponse>
export type MutationFetcher = (input: string, body: { arg: any }) => Promise<IResponse>