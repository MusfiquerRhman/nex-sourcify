import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useCallback, useState, useMemo } from "react";
import { createExFactoryFormSchema } from "./formSchema";
import type { ExFactoryFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import type { GetExFactoryByIdTypes } from "~/types/merchandisingAPITypes";
import { api } from "~/trpc/react";
import { useDecodedUser } from "~/hooks";

type Orders = NonNullable<GetExFactoryByIdTypes['orders']>[number];

type PrefillValues = Partial<ExFactoryFormValues['exfactory']>;

export const useExfactoryForm = (
    initialData?: GetExFactoryByIdTypes,
    prefillValues?: PrefillValues,
) => {
    const getDefaultValues = useCallback((): ExFactoryFormValues => {
        if (!initialData) {
            return {
                exfactory: {
                    buyer_id: String(prefillValues?.buyer_id ?? ''),
                    factory_id: String(prefillValues?.factory_id ?? ''),
                    exfactory_date: formatDateForInput(new Date()),
                    exfactory_no: '',
                    remarks: "",
                    payment_type: String(prefillValues?.payment_type ?? ''),
                    orders: prefillValues?.orders ?? [],
                },
            };
        }

        return {
            exfactory: {
                ...initialData,
                db_id: initialData?.db_id,
                buyer_id: initialData.buyer_id?.toString() ?? '',
                factory_id: initialData.factory_id?.toString() ?? '',
                payment_type: initialData.payment_type?.toString() ?? '',
                remarks: initialData.remarks ?? "",
                exfactory_no: initialData.exfactory_no ?? "",
                exfactory_date: initialData.exfactory_date 
                    ? formatDateForInput(new Date(initialData.exfactory_date)) 
                    : formatDateForInput(new Date()),
                orders: initialData.orders?.map((order: Orders) => ({
                    ...order,
                    db_id: order?.db_id,
                    order_id: String(order.order_id),
                })) ?? [],
            },
        };
    }, [initialData, prefillValues]);

    const isEdit = Boolean(initialData);

    // Tolerance state, default to 10% if not fetched, no buyer selected, or error occurs
    const [tolerance, setTolerance] = useState<number>(10);

    const { isAdmin } = useDecodedUser();

    // Create Zod schema with current tolerance
    const exFactorySchema = useMemo(
        () => createExFactoryFormSchema(tolerance ?? 0, isAdmin),
        [tolerance, isAdmin]
    );

    // Initialize form with Zod resolver and default values
    const methods = useForm<ExFactoryFormValues>({
        resolver: zodResolver(exFactorySchema),
        defaultValues: getDefaultValues(),
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, watch, control } = methods;

    // Effect to reset form when initialData changes
    useEffect(() => {
        methods.reset(getDefaultValues());
    }, [methods, getDefaultValues]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof ExFactoryFormValues);
    }, [validationError, setFocus]);

    const buyerId = watch("exfactory.buyer_id");

    // Fetch tolerance level for selected buyer and update state
    const tolerance_level = api.toleranceLevel.getToleranceByBuyer.useQuery(
        { buyerID: Number(buyerId) },
        { enabled: !!buyerId }
    ).data;

    // Update tolerance state when fetched tolerance level changes
    useEffect(() => {
        if (tolerance_level) {
            setTolerance(tolerance_level);
        }
    }, [tolerance_level]);

    return {
        methods,
        handleSubmit,
        formFields: useFormFields({
            buyerID: Number(buyerId), 
            isEdit,
        }),
        validationError,
        trigger,
        watch,
        control,
    };
}

