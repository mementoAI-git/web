import Link from "next/link";
import { Button } from "@/components/Buttons";
import { cn } from "@/utility";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center px-6 py-12 max-w-md mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bricolage font-bold text-gray-800 mb-3">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 font-inter leading-relaxed">
            The page you're looking for seems to have wandered off into the digital void.
            Don't worry, even the best memories sometimes get lost!
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-bounce">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33M15 19l3 3m0 0l3-3m-3 3l-3-3"
                />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center animate-ping">
              <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            title="Go Back Home"
            href="/"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          />

          <div className="flex gap-4 justify-center">
            {/* <Link
              href="/explore"
              className={cn(
                "px-6 py-3 text-sm font-inter font-semibold text-gray-700",
                "border-2 border-gray-300 rounded-lg hover:border-blue-500",
                "hover:text-blue-600 transition-all duration-300",
                "flex items-center gap-2"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore
            </Link> */}

            <Link
              href="/memories"
              className={cn(
                "px-6 py-3 text-sm font-inter font-semibold text-gray-700",
                "border-2 border-gray-300 rounded-lg hover:border-purple-500",
                "hover:text-purple-600 transition-all duration-300",
                "flex items-center gap-2"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Memories
            </Link>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4 font-inter">
            Need help? Try these:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/chat"
              className="text-blue-600 hover:text-blue-800 font-inter font-medium transition-colors"
            >
              Start a Chat
            </Link>
            <Link
              href="/settings"
              className="text-blue-600 hover:text-blue-800 font-inter font-medium transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/time-capsule"
              className="text-blue-600 hover:text-blue-800 font-inter font-medium transition-colors"
            >
              Time Capsule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 