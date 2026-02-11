import TextHighlight from "../TextHighlight";
import { getAdjustedBackground } from "./helpers";
import type { CardCustomization } from "../CapsulePreviewCard";

// components/media-cards/AudioCard.tsx
interface AudioCardProps {
  duration: string;
  title: string;
  onClick?: () => void;
  className?: string;
  style?: CardCustomization;
}

export default function AudioCard({
  duration,
  title = "",
  onClick,
  style,
  className = "",
}: AudioCardProps) {
  return (
    <div className={`${className} overflow-hidden`}>
      {/* Preview - Fixed 136×162 aspect ratio */}
      <div
        onClick={onClick}
        className="relative w-full aspect-68/81 mb-3 bg-white rounded-2xl overflow-hidden cursor-pointer group"
      >
        {/* Background decorative curves */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg
            viewBox="0 0 200 200"
            className="absolute -top-10 -left-10 w-40 h-40 text-gray-100"
            fill="currentColor"
          >
            <circle cx="100" cy="100" r="80" opacity="0.5" />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute -bottom-10 -right-10 w-48 h-48 text-gray-50"
            fill="currentColor"
          >
            <circle cx="100" cy="100" r="90" opacity="0.3" />
          </svg>
        </div>

        {/* Audio waveform - scaled for taller aspect */}
        <div className="absolute inset-0 flex items-center justify-center pb-4">
          {/*<div className="flex items-end gap-[3px]">
            {[12, 24, 36, 28, 40, 32, 44, 28, 36, 20, 32, 16].map((h, i) => (
              <div
                key={i}
                className="w-[3px] bg-gray-400 rounded-full transition-all group-hover:bg-gray-500"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>*/}

          <svg
            width="79"
            height="70"
            viewBox="0 0 35 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 5.82878C0 5.53613 0.277652 5.2989 0.620152 5.2989C0.962653 5.2989 1.2403 5.53613 1.2403 5.82878L1.2403 12.1875C1.2403 12.4801 0.962653 12.7173 0.620152 12.7173C0.277652 12.7173 0 12.4801 0 12.1875L0 5.82878Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M3.30748 5.82878C3.30748 5.53613 3.58513 5.2989 3.92763 5.2989C4.27013 5.2989 4.54778 5.53613 4.54778 5.82878L4.54778 12.1875C4.54778 12.4801 4.27013 12.7173 3.92763 12.7173C3.58513 12.7173 3.30748 12.4801 3.30748 12.1875L3.30748 5.82878Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M6.61496 3.70923C6.61496 3.41658 6.89261 3.17934 7.23511 3.17934C7.57761 3.17934 7.85526 3.41658 7.85526 3.70923L7.85526 14.307C7.85526 14.5997 7.57761 14.8369 7.23511 14.8369C6.89261 14.8369 6.61496 14.5997 6.61496 14.307L6.61496 3.70923Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M9.92244 2.64945C9.92244 2.3568 10.2001 2.11956 10.5426 2.11956C10.8851 2.11956 11.1627 2.3568 11.1627 2.64945L11.1627 15.3668C11.1627 15.6594 10.8851 15.8967 10.5426 15.8967C10.2001 15.8967 9.92244 15.6594 9.92244 15.3668L9.92244 2.64945Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M13.2299 3.70923C13.2299 3.41658 13.5076 3.17934 13.8501 3.17934C14.1926 3.17934 14.4702 3.41658 14.4702 3.70923L14.4702 14.307C14.4702 14.5997 14.1926 14.8369 13.8501 14.8369C13.5076 14.8369 13.2299 14.5997 13.2299 14.307L13.2299 3.70923Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M16.5374 0.52989C16.5374 0.23724 16.815 0 17.1575 0C17.5 0 17.7777 0.23724 17.7777 0.529889V17.4864C17.7777 17.779 17.5 18.0162 17.1575 18.0162C16.815 18.0162 16.5374 17.779 16.5374 17.4864V0.52989Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M19.8449 3.70923C19.8449 3.41658 20.1225 3.17934 20.465 3.17934C20.8075 3.17934 21.0852 3.41658 21.0852 3.70923V14.307C21.0852 14.5997 20.8075 14.8369 20.465 14.8369C20.1225 14.8369 19.8449 14.5997 19.8449 14.307V3.70923Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M23.1523 5.82878C23.1523 5.53613 23.43 5.2989 23.7725 5.2989C24.115 5.2989 24.3927 5.53613 24.3927 5.82878V12.1875C24.3927 12.4801 24.115 12.7173 23.7725 12.7173C23.43 12.7173 23.1523 12.4801 23.1523 12.1875V5.82878Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M26.4598 2.64945C26.4598 2.3568 26.7375 2.11956 27.08 2.11956C27.4225 2.11956 27.7001 2.3568 27.7001 2.64945V15.3668C27.7001 15.6594 27.4225 15.8967 27.08 15.8967C26.7375 15.8967 26.4598 15.6594 26.4598 15.3668V2.64945Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M29.7673 3.70923C29.7673 3.41658 30.045 3.17934 30.3875 3.17934C30.73 3.17934 31.0076 3.41658 31.0076 3.70923V14.307C31.0076 14.5997 30.73 14.8369 30.3875 14.8369C30.045 14.8369 29.7673 14.5997 29.7673 14.307V3.70923Z"
              fill="black"
              fill-opacity="0.2"
            />
            <path
              d="M33.0748 7.24182C33.0748 6.94917 33.3524 6.71193 33.6949 6.71193C34.0374 6.71193 34.3151 6.94917 34.3151 7.24182V10.7744C34.3151 11.0671 34.0374 11.3043 33.6949 11.3043C33.3524 11.3043 33.0748 11.0671 33.0748 10.7744V7.24182Z"
              fill="black"
              fill-opacity="0.2"
            />
          </svg>
        </div>

        {/* Duration - positioned lower for taller card */}
        <div className="absolute inset-0 flex items-center justify-center pt-20">
          <span className="text-lg font-medium text-gray-700">{duration}</span>
        </div>
      </div>
      {/* Title - Outside the card */}
      {/*<TextHighlight
        style={{
          backgroundColor: getAdjustedBackground(
            style.backgroundColor,
            style.textColor || "#ffffff",
          ),
        }}
      >
        {title}
      </TextHighlight>*/}
      <TextHighlight
        style={{
          backgroundColor: getAdjustedBackground(
            style.backgroundColor,
            style.textColor || "#ffffff",
          ),
        }}
      >
        {/*My thoughts on the meaning of life*/}
        {title}
      </TextHighlight>
    </div>
  );
}
