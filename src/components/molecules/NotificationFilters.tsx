import type { NotificationFilter, NotificationModuleOption } from "~/types/notification";
import CountFilterButton from "../atoms/CountFilterButton";
import NotificationModuleFilter from "./NotificationModuleFilter";

type NotificationFiltersProps = {
    selected: NotificationFilter;
    selectedModuleId: number | null;
    modules: NotificationModuleOption[];
    counts: Record<NotificationFilter, number>;
    onChange: (filter: NotificationFilter) => void;
    onModuleChange: (moduleId: number | null) => void;
};

const filters = [
    { value: "unread", label: "Pending" },
    { value: "all", label: "All" },
    { value: "system", label: "System" },
] as const;

const NotificationFilters = (props: NotificationFiltersProps) => {
    const { selected, selectedModuleId, modules, counts, onChange, onModuleChange } = props;

    return (
        <div className="flex items-center gap-2">
            <div role="group" aria-label="Filter notifications" className="flex min-w-0 flex-1 gap-1 rounded-lg bg-gray-100 p-1">
                {filters.map(({ value, label }) => (
                    <CountFilterButton key={value} label={label} count={counts[value]} active={selected === value} onClick={() => onChange(value)} />
                ))}
            </div>
            {modules.length > 0 && <NotificationModuleFilter selectedModuleId={selectedModuleId} modules={modules} onChange={onModuleChange} />}
        </div>
    );
};

export default NotificationFilters;
