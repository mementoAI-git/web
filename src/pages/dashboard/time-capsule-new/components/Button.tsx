import { PlusIcon } from "@/components/icons";
import { cn } from "@/utility";

const Button = ({ children, onClick }) => (
  <div>
    <button
      onClick={onClick}
      className={cn("btn", "rounded-full! md:w-full w-fit bg-orange!")}
    >
      <PlusIcon width={15} />
      <span>{children}</span>
    </button>
  </div>
);

export default Button;
