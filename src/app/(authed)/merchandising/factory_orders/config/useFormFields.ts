import { api } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import type { FactoryOrderFormValues } from "./formSchema";

export type Field<T extends keyof FactoryOrderFormValues['factoryOrder']> = BaseField<T>;

interface PropsType {
    id: string;
    ref_no: string;
    isEdit?: boolean;
}

export const useFormFields = ({availableOrders, isEdit}: {availableOrders: PropsType[], isEdit?: boolean}): Field<keyof FactoryOrderFormValues['factoryOrder']>[] => {
    const { data: currencies = [] } = api.currencies.getAll.useQuery();

    return [
        {
            name: "order_id",
            label: "Buyer Order",
            placeholder: "Select Buyer Order",
            type: "select",
            options: availableOrders.map((o) => ({ label: o.ref_no, value: o.id.toString() })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "buyer_name",
            label: "Buyer Name",
            placeholder: "Enter buyer name",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_name",
            label: "Factory Name",
            placeholder: "Enter factory name",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "order_date",
            label: "Order Date",
            placeholder: "Select order date",
            disabled: true,
            optional: true,
        },
        {
            name: "factory_order_date",
            label: "Factory Order Date",
            placeholder: "Select factory order date",
            type: "date",
        }, 
        {
            name: "department",
            label: "Department",
            placeholder: "Enter department",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "season_name",
            label: "Season Name",
            placeholder: "Enter season name",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "currency_id",
            label: "Currency",
            placeholder: "Select currency",
            type: "select",
            options: currencies.map((currency) => ({ label: currency.name, value: currency.id.toString() })),
            optional: true,
        },
        {
            name: "currency_rate",
            label: "Currency Rate",
            placeholder: "Enter currency rate",
            type: "number",
            optional: true,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            type: "textarea",
            optional: true,
        },
    ];
}