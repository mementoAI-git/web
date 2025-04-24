import confetti from "@/public/image/confetti.png";
import Image from "next/image";
import facebook from "@/public/image/Facebook.png";
import twitter from "@/public/image/twitter.png";
import instagram from "@/public/image/instagram.png";
import linkedin from "@/public/image/linkedin.png";

export default function SharePost() {
  return (
    <div className="space-y-6">
      <Image
        className="mx-auto size-16 object-contain"
        src={confetti}
        alt="confetti"
      />
      <div className="flex flex-col justify-center gap-3 text-center">
        <span className="font-inter text-3xl font-semibold text-secondary">
          New Post added
        </span>
        <span className="text-center font-inter text-sm text-grey-600">
          You have saved a new entry to memento
        </span>
      </div>
      <div className="space-y-4 rounded-2xl border border-[rgba(249,249,249,1)] bg-[rgba(252,252,253,1)] p-4">
        <div>
          <span className="text-sm font-medium text-grey-600">Share link</span>
          <div className="flex h-10 w-full rounded-lg border border-[rgba(213,215,218,1)] bg-white">
            <span className="flex h-full flex-1 items-center border-r border-inherit px-3 text-grey-600">
              www.memento.io/post/73f9320d
            </span>
            <span className="flex cursor-pointer items-center px-3.5">
              Copy
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-11">
          {[facebook, linkedin, twitter, instagram].map((img, i) => (
            <div
              key={i}
              className="flex size-11 items-center justify-center rounded-full bg-grey-500"
            >
              <Image
                className="size-5 object-contain"
                src={img}
                key={i}
                alt="social logos"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <button className="btn flex-1">Add another entry</button>
        <button className="btn flex-1 !bg-grey-400 !text-secondary">
          Dismiss
        </button>
      </div>
    </div>
  );
}
