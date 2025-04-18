export default function Streak() {
  return (
    <div className="flex w-full max-w-[335px] flex-1 flex-col gap-5 rounded-2xl border border-grey-700 bg-[#FCFCFD] p-10 font-inter">
      <span className="text-xs font-medium text-grey-800">
        ✌🏽 MY WEEKLY STREAK
      </span>
      <div className="mx-auto flex items-stretch justify-between uppercase">
        {["m", "t", "w", "t", "f", "s", "s"].map((d, i) => (
          <div
            key={i}
            className="flex h-[46px] w-[34px] flex-col items-center justify-between"
          >
            <span className="text-xs text-grey-600">{d}</span>
            <svg
              className="aspect-square w-[16.67px]"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.9974 18.3337C14.5998 18.3337 18.3307 14.6027 18.3307 10.0003C18.3307 5.39795 14.5998 1.66699 9.9974 1.66699C5.39502 1.66699 1.66406 5.39795 1.66406 10.0003C1.66406 14.6027 5.39502 18.3337 9.9974 18.3337Z"
                fill={i < 3 ? "#EFE5FF" : "white"}
              />
              <path
                d="M6.2474 10.0003L8.7474 12.5003L13.7474 7.50033M18.3307 10.0003C18.3307 14.6027 14.5998 18.3337 9.9974 18.3337C5.39502 18.3337 1.66406 14.6027 1.66406 10.0003C1.66406 5.39795 5.39502 1.66699 9.9974 1.66699C14.5998 1.66699 18.3307 5.39795 18.3307 10.0003Z"
                stroke={i < 3 ? "#5A00E8" : "#EBEBEB"}
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
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
