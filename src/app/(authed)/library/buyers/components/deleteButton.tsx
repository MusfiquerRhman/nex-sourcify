import Image from "next/image";
import { deleteIcon } from "~/assets";

type DeleteButtonProps = {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  alt?: string;
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export const DeleteButton = ({ onClick, size = "md", alt = "Delete" }: DeleteButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:cursor-pointer rounded-lg p-2 m-2 hover:bg-red-50 transition"
    >
      <div className={sizeMap[size]}>
        <Image width={20} height={20} src={deleteIcon.src} alt={alt} />
      </div>
    </button>
  );
};
