import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { commissionDistribution } from "./formSchema";
import type { CommissionDistributionFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import type { GetCommissionDistributionByIdTypes } from "~/types/merchandisingAPITypes";

type CommissionDistributionDetails = NonNullable<GetCommissionDistributionByIdTypes>['details'][number];

export const useCommissionDistributionForm = (initialData?: GetCommissionDistributionByIdTypes) => {
    const transformedInitialData = useMemo(() => {
        return initialData ? {
            db_id: initialData.id,
            order_id: initialData.order_id?.toString() ?? '',
            distribution_date: formatDateForInput(new Date()),
            remarks: '',
            details: initialData.details?.map((detail: CommissionDistributionDetails) => ({
                ...detail,
                db_id: detail?.db_id,
                style: detail.style ?? '',
                po: detail.po ?? '',
                destination: detail.destination ?? '',
                size: detail.size ?? '',
                order_quantity: Number(detail.order_quantity ?? 0),
                rdl_fob: detail.rdl_fob?.toFixed(2),
                factory_fob: detail.factory_fob?.toFixed(2),
                rdl_value: detail.rdl_value?.toFixed(2),
                factory_value: detail.factory_value?.toFixed(2),
                margin_per_piece: detail.margin_per_piece?.toFixed(2),
                commission_value: detail.commission_value?.toFixed(2),
                commission_percentage: detail.commission_percentage?.toFixed(2),
                dhaka_commission_percentage: parseFloat(String(detail.dhaka_commission_percentage ?? "0")),
                overseas_commission_percentage: parseFloat(String(detail.overseas_commission_percentage ?? "0")),
                others_commission_percentage: parseFloat(String(detail.others_commission_percentage ?? "0")),
            })) ?? [],
        } : undefined;
    }, [initialData]);

    const methods = useForm<CommissionDistributionFormValues>({
        resolver: zodResolver(commissionDistribution),
        defaultValues: transformedInitialData ?? {
            db_id: undefined,
            order_id: '',
            distribution_date: formatDateForInput(new Date()),
            remarks: "",
            details: [],
        },
    });

    const { handleSubmit, formState: { errors: validationError }, trigger, watch, control } = methods;

    // Effect to reset form when initialData changes
    useEffect(() => {
        if (transformedInitialData) {
            methods.reset(transformedInitialData);
        }
    }, [initialData, methods, transformedInitialData]);

    const { data: orders = [] } = api.commissionDistribution.getOrderIdForCommissionDistribution.useQuery();

    let availableOrderOptions;

    if(initialData?.order_id && initialData.ref_no) {
        availableOrderOptions = [{ order_id: initialData.order_id, ref_no: initialData.ref_no }];
    } else {
        availableOrderOptions = orders;
    }

    const formFields = useFormFields(availableOrderOptions 
            ? {availableOrders: availableOrderOptions, isEdit: !!initialData} 
            : {availableOrders: [], isEdit: !!initialData});

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