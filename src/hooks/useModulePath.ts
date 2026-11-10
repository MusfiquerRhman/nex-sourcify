import { usePathname } from "next/navigation";
import { getModulePath } from "~/utils/modulePath";

const useModulePath = () => {
    return getModulePath(usePathname());
}

export default useModulePath;
