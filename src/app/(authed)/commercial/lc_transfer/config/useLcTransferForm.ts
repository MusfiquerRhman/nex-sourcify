/**
 * @description
 * This custom hook manages the state and logic for the LC Transfer form. 
 * It initializes the form with default values or transformed initial data when editing an existing LC Transfer.
 * The hook uses react-hook-form for form state management and validation, with zod for schema validation.
 * It also fetches necessary data such as the list of LCs for selection and LC details when an LC is selected.
 * The hook provides the form methods, validation errors, and other necessary data to the components that render the form.
 * Key functionalities:
 * 1. Initializes form state with default values or transformed initial data for editing.
 * 2. Fetches the list of LCs for selection in the form, with special handling for edit mode to show only the selected LC.
 * 3. Fetches LC details when an LC is selected and updates the form fields accordingly.
 * 4. Provides form methods and validation errors to the components that render the form.
 * @params
 * - initialData: Optional initial data for the LC Transfer, used to populate the form when editing an existing LC Transfer.
 * @returns
 * An object containing the form methods, validation errors, and other necessary data for rendering the LC Transfer form.
 */

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { lcTransferFormSchema } from "./formSchema";
import type { LCTransferFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { GetLCTransferByIdTypes } from "~/types/commercialAPITypes";

type LcTransferDetails = NonNullable<GetLCTransferByIdTypes>['details'][number];

export const useLCTransferForm = (initialData?: GetLCTransferByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            lc_id: initialData.lc_id?.toString() ?? '',
            lc_transfer_date: initialData.lc_transfer_date ? formatDateForInput(new Date(initialData.lc_transfer_date)) : '',
            remarks: initialData.remarks ?? '',
            details: initialData.details?.map((detail: LcTransferDetails) => ({
                db_id: detail.id,
                transfer_date: detail.lc_transfer_date ? formatDateForInput(new Date(detail.lc_transfer_date)) : '',
                transfer_quantity: detail.lc_transfer_quantity ?? 0,
                transfer_value: detail.lc_transfer_value ?? 0,
                factory_id: detail.factory_id ?? 0,
                sales_contract_id: detail.sales_contract_id ?? '',
                sales_contract_no: detail.sales_contract_no ?? '',
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<LCTransferFormValues>({
        resolver: zodResolver(lcTransferFormSchema),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            lc_id: '',
            lc_transfer_date: formatDateForInput(new Date()),
            lc_open_date: '',
            currency_name: '',
            lc_receive_date: '',
            last_shipment_date: '',
            buyer_name: '',
            lc_expire_date: '',
            lc_quantity: '',
            lc_value: '',
            remarks: "",
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control, reset } = methods;
    
    useEffect(() => {    
        if (transformedInitialData) {
            reset(transformedInitialData);
        }
    }, [transformedInitialData, reset]);

    const lcList = api.lcTransfer.getLCForLcTransferByUser.useQuery().data || [];

    // If in edit mode and initialData has lc_id and lc_no, use that as the only option. 
    // Otherwise, fetch the list of LCs for selection.
    let availableLcOptions;

    if(initialData?.lc_id && initialData.lc_no) {
        availableLcOptions = [{ lc_id: initialData.lc_id, lc_no: initialData.lc_no }];
    } else {
        availableLcOptions = lcList;
    }

    const formFields = useFormFields(availableLcOptions 
            ? {lcList: availableLcOptions, isEdit: !!initialData} 
            : {lcList: [], isEdit: !!initialData});

    const lcId = useWatch({ control, name: 'lc_id' });

    const { data: lcDetails } = api.lcTransfer.getLCDetailsForTransfer.useQuery(
        !!lcId ? { lc_id: lcId } : skipToken
    );

    useEffect(() => {   
        if(lcDetails) {
            methods.setValue(
                'lc_open_date', lcDetails.lc_open_date 
                    ? formatDateForInput(new Date(lcDetails.lc_open_date)) : ''
            );

            methods.setValue(
                'currency_name', lcDetails.currency?.toString() ?? ''
            );

            methods.setValue(
                'lc_receive_date', lcDetails.lc_received_date 
                    ? formatDateForInput(new Date(lcDetails.lc_received_date)) : ''
            );

            methods.setValue(
                'last_shipment_date', lcDetails.latest_shipment_date 
                    ? formatDateForInput(new Date(lcDetails.latest_shipment_date)) : ''
            );

            methods.setValue(
                'buyer_name', lcDetails.buyer_name ?? ''
            );

            methods.setValue(
                'lc_expire_date', lcDetails.lc_expire_date 
                    ? formatDateForInput(new Date(lcDetails.lc_expire_date)) : ''
            );

            methods.setValue(
                'lc_quantity', lcDetails.lc_quantity?.toString() ?? ''
            );

            methods.setValue(
                'lc_value', lcDetails.lc_value?.toString() ?? ''
            );

            methods.setValue(
                'buyer_id', lcDetails.buyer_id?.toString() ?? ''
            );
        }
    }, [lcDetails, methods]);

    return {
        methods,
        handleSubmit,
        formFields,
        validationError,
        trigger,
        watch,
        control,
    };
}