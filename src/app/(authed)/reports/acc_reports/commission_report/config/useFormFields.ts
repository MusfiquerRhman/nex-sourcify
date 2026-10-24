import type { BaseField } from "~/types/form";
import type { CommissionDistributionReportFormValues } from "./formSchema";

export const useFormFields = (): BaseField<keyof CommissionDistributionReportFormValues>[] => [
    {
        name: "from_date",
        label: "From Date",
        type: "date",
    },
    {
        name: "to_date",
        label: "To Date",
        type: "date",
    },
];