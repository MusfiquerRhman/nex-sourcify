import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

export const useSalesContractForm = (salesContractData?: any) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: salesContractData ?? {
            db_id: undefined,
            buyer_id: undefined,
            factory_id: undefined,
            sales_contract_no: undefined,
            amendment_date: formatDateForInput(new Date()),// Default to today's date in YYYY-MM-DD format
            amendment_no: undefined,
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control, setValue } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (salesContractData) {
            methods.reset({
                ...salesContractData,
                db_id: salesContractData.id  ,
                buyer_id: salesContractData.buyer_id?.toString(),
                factory_id: salesContractData.factory_id?.toString(),
                sales_contract_no: salesContractData.sales_contract_no,
                amendment_no: salesContractData.amendment_no.toString(),
                remarks: salesContractData.remarks ?? '',
                amendment_date: salesContractData.amendment_date 
                    ? formatDateForInput(new Date(salesContractData.amendment_date)) 
                    : formatDateForInput(new Date()),   
                details: salesContractData.details?.map((detail: any) => ({
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

    const factory_id = useWatch({ control, name: 'factory_id' });

    const isEdit = Boolean(salesContractData);

    const { data: salesContracts } = api.salesContractAmendments.getSalesContractsByFactoryId.useQuery(
        factory_id ? { factory_id: Number(factory_id) } : skipToken,
    )

    let salesContractOptions = [];

    if(salesContractData && salesContractData?.sales_contract_id && salesContractData?.sales_contract_no){
        salesContractOptions = [
            {
                sales_contract_no: salesContractData.sales_contract_no,
                id: salesContractData.sales_contract_id.toString(),
            }
        ]
    } 
    else {
        salesContractOptions = salesContracts ?? [];
    }

    return { 
        methods, 
        handleSubmit,
        formFields: formFields({
            isEdit,
            salesContracts: salesContractOptions
        }),
        validationError, 
        control 
    };
}