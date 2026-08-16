import { api } from "~/trpc/react";
// Configuration for table columns
export const tableHeaders= () => {
    const levels = api.levels.getLevels.useQuery();

    return [
        { key: 'module_name', label: 'Module'},
        { key: 'name', label: 'Name', type: 'text'},
        { key: 'department_name', label: 'Department', type: 'text'},
        { key: 'level_id', label: 'Level', type: 'select', options: levels.data?.map((lvl) => ({ label: lvl.name, value: lvl.id })) ?? []},
    ]
};
