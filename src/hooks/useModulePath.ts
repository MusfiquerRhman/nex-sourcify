import { usePathname } from "next/navigation";

const useModulePath = () => {
    const path = usePathname().split('/');
    const modulePath = path.length === 4 ? `/${path[1]}/${path[2]}/${path[3]}` : `/${path[1]}/${path[2]}`;
    return {path: modulePath, new: path[3] === 'new', edit: path[3] === 'edit'};
}

export default useModulePath;