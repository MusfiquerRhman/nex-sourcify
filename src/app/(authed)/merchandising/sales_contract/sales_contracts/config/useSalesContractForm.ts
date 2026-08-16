import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetSalesContractByIdTypes } from "~/types/merchandisingAPITypes";

type SalesContractDetails = NonNullable<GetSalesContractByIdTypes>['details'][number];

export const useSalesContractForm = (salesContractData?: GetSalesContractByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: salesContractData ? {
            db_id: salesContractData.id?.toString(),
            buyer_id: salesContractData.buyer_id?.toString(),
            factory_id: salesContractData.factory_id?.toString(),
            sales_contract_no: salesContractData.sales_contract_no,
            sales_contract_date: salesContractData.sales_contract_date 
                ? formatDateForInput(new Date(salesContractData.sales_contract_date)) 
                : formatDateForInput(new Date()),
            buyer_bank_id: salesContractData.buyer_bank_id?.toString(),
            factory_bank_id: salesContractData.factory_bank_id?.toString(),
            rdl_bank_id: salesContractData.rdl_bank_id?.toString(),
            negotiation_bank_id: salesContractData.negotiation_bank_id?.toString(),
            partial_shipment: salesContractData.partial_shipment ?? true,
            destination_id: salesContractData.destination_id?.toString(),
            freight_terms_id: salesContractData.freight_terms_id?.toString(),
            consignee_ids: salesContractData.consignee_ids ?? [],
            company_id: salesContractData.company_id?.toString(),
            contact_person_id: salesContractData.contact_person_id?.toString(),
            details: salesContractData.details?.map((detail: SalesContractDetails) => ({
                db_id: detail.id,
                ...detail,
            })) ?? [],
        } : {
            db_id: undefined,
            buyer_id: undefined,
            factory_id: undefined,
            sales_contract_no: undefined,
            sales_contract_date: formatDateForInput(new Date()),
            buyer_bank_id: undefined,
            factory_bank_id: undefined,
            rdl_bank_id: undefined,
            negotiation_bank_id: undefined,
            partial_shipment: true,
            destination_id: undefined,
            freight_terms_id: '1',
            consignee_ids: [],
            company_id: undefined,
            contact_person_id: '1',
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control } = methods;

    // Effect to reset form when salesContractData changes
    useEffect(() => {
        if (salesContractData) {
            methods.reset({
                db_id: salesContractData.id?.toString(),
                buyer_id: salesContractData.buyer_id?.toString(),
                factory_id: salesContractData.factory_id?.toString(),
                sales_contract_no: salesContractData.sales_contract_no,
                buyer_bank_id: salesContractData.buyer_bank_id?.toString(),
                factory_bank_id: salesContractData.factory_bank_id?.toString(),
                rdl_bank_id: salesContractData.rdl_bank_id?.toString(),
                negotiation_bank_id: salesContractData.negotiation_bank_id?.toString(),
                partial_shipment: salesContractData.partial_shipment ?? true,
                destination_id: salesContractData.destination_id?.toString(),
                freight_terms_id: salesContractData.freight_terms_id?.toString(),
                company_id: salesContractData.company_id?.toString(),
                contact_person_id: salesContractData.contact_person_id?.toString(),
                sales_contract_date: salesContractData.sales_contract_date 
                    ? formatDateForInput(new Date(salesContractData.sales_contract_date)) 
                    : formatDateForInput(new Date()),
                consignee_ids: salesContractData.consignee_ids ?? [],
                details: salesContractData.details?.map((detail: SalesContractDetails) => ({
                    db_id: detail.id,
                    ...detail,
                })) ?? [],
            });
        }
    }, [salesContractData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);

    const buyer_id = useWatch({ control, name: 'buyer_id' });
    const factory_id = useWatch({ control, name: 'factory_id' });
    const company_id = useWatch({ control, name: 'company_id' });

    const isEdit = Boolean(salesContractData);
 
    return { 
        methods, 
        handleSubmit,
        formFields: formFields({
            buyer_id: buyer_id ? Number(buyer_id) : undefined,
            factory_id: factory_id ? Number(factory_id) : undefined,
            company_id: company_id ? Number(company_id) : undefined,
            isEdit,
        }),
        validationError, 
        control 
    };
}