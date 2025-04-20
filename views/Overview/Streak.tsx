import endpoint from "@/api/endpoint"
import useFetcher, { useUser } from "@/hooks/use-fetcher"
import { isEmpty } from "@/utility"
import dayjs from "dayjs"
import { useEffect, useMemo } from "react"

export default function Streak() {
  const { data, mutate } = useUser()
  const { trigger } = useFetcher(endpoint.updateStreak)

  const streak = useMemo(() => {
    const end_index = dayjs(data?.data.last_seen).get("day")
    return {
      start_index: end_index + Math.max(data?.data?.streak, 0),
      end_index
    }
  }, [data?.data])

  useEffect(() => {
    if (isEmpty(data?.data)) return;

    if (!dayjs().isSame(data?.data.last_seen, "date")) {
      trigger()
        .then(res => mutate({ ...data, data: { ...data.data, ...res.data } }))
        .catch(console.log)
    }
  }, [data?.data, trigger, mutate])
  return (
    <div className="max-w-[335px] w-full flex flex-col gap-5 flex-1 font-inter rounded-2xl p-10 border-grey-700 bg-[#FCFCFD] border">
      <span className="text-grey-800 font-medium text-xs">✌🏽 MY WEEKLY STREAK</span>
      <div className="mx-auto flex justify-between uppercase items-stretch">
        {
          ["s", "m", "t", "w", "t", "f", "s"].map((d, i) => (
            <div key={i} className="w-[34px] h-[46px] flex flex-col items-center justify-between">
              <span className="text-grey-600 text-xs">{d}</span>
              <svg className="w-[16.67px] aspect-square" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.9974 18.3337C14.5998 18.3337 18.3307 14.6027 18.3307 10.0003C18.3307 5.39795 14.5998 1.66699 9.9974 1.66699C5.39502 1.66699 1.66406 5.39795 1.66406 10.0003C1.66406 14.6027 5.39502 18.3337 9.9974 18.3337Z" fill={streak.start_index > i && streak.end_index <= i ? "#EFE5FF" : "white"} />
                <path d="M6.2474 10.0003L8.7474 12.5003L13.7474 7.50033M18.3307 10.0003C18.3307 14.6027 14.5998 18.3337 9.9974 18.3337C5.39502 18.3337 1.66406 14.6027 1.66406 10.0003C1.66406 5.39795 5.39502 1.66699 9.9974 1.66699C14.5998 1.66699 18.3307 5.39795 18.3307 10.0003Z" stroke={streak.start_index > i && streak.end_index <= i ? "#5A00E8" : "#EBEBEB"} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))
        }
      </div>
      <span className="text-left text-grey-600">
        Great start so far! Keep going.
      </span>
      <span className="block cursor-pointer text-center text-xs font-medium text-primary">
        See more stats
      </span>
    </div>
  );
}
