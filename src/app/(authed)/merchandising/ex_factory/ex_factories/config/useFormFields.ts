import { api } from "~/trpc/react";
import type { ExFactoryFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { useDecodedUser } from "~/hooks";

export type Field<T extends keyof ExFactoryFormValues['exfactory']> = BaseField<T>;

interface FormProps {
    buyerID: number;
    isEdit?: boolean;
}

export const useFormFields = (Props: FormProps): Field<keyof ExFactoryFormValues['exfactory']>[] => {
    const {buyerID, isEdit} = Props;

    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    
    const terms = api.terms.getTermsByBuyer.useQuery({ buyerID }).data ?? [];

    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    const { isAdmin } = useDecodedUser();

    return [
        {
            name: 'exfactory_no',
            label: 'Ex Factory No',
            type: 'text',
            disabled: true,
            optional: true,
        },
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: buyers.map((b) => ({ label: b.buyer_name, value: b.id.toString() })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: 'payment_type',
            label: 'Payment Type',
            type: 'select',
            options: terms.map((t) => ({ label: t.name, value: t.id.toString() })),
            disabled: isEdit,
            optional: isEdit
        }, 
        {
            name: 'exfactory_date',
            label: 'Ex Factory Date',
            placeholder: 'Select ex factory date',
            type: 'date',
            optional: isEdit,
            minDate: isAdmin ? undefined : 2
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}