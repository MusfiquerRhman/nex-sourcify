import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { factoryOrderFormSchema } from "./formSchema";
import type { FactoryOrderFormValues } from "./formSchema";
import { useFormFields } from "./useFormFields";
import { formatDate, formatDateForInput } from "~/utils/localDateString";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { GetFactoryOrderByIdTypes, GetBuyerOrderDetailsByFactoryOrderIdTypes } from "~/types/merchandisingAPITypes";

type OrderStyle = NonNullable<GetFactoryOrderByIdTypes>['styles'][number];
type Shipments = NonNullable<OrderStyle['shipments']>[number];

type OrderDetailsStyle = NonNullable<GetBuyerOrderDetailsByFactoryOrderIdTypes>['styles'][number];
type OrderDetailsShipments = NonNullable<OrderDetailsStyle['shipments']>[number];

export const useFactoryOrderForm = (initialData?: GetFactoryOrderByIdTypes) => {
    const mapToFormValues = (data: GetFactoryOrderByIdTypes | null | undefined): FactoryOrderFormValues => {
        if (!data) {
            return {
                factoryOrder: {
                    db_id: undefined,
                    order_id: '',
                    factory_name: '',
                    season_name: '',
                    buyer_name: '',
                    order_date: '',
                    factory_order_date: formatDateForInput(new Date()),
                    department: '',
                    remarks: "",
                    currency_id: "1",
                    currency_rate: 1,
                    styles: [],
                },
            };
        }
        return {
            factoryOrder: {
                db_id: data.id,
                order_id: data.order_id ?? '',
                factory_name: '', 
                season_name: '',
                buyer_name: '',
                order_date: '',
                factory_order_date: data.factory_order_date ? formatDateForInput(data.factory_order_date) : '',
                department: '',
                remarks: data.remarks ?? "",
                currency_id: data.currency_id?.toString() ?? "1",
                currency_rate: 1,
                styles: data.styles?.map((style: OrderStyle) => ({
                    db_id: style.db_id,
                    shipments: style.shipments?.map((shipment: Shipments) => ({
                        db_id: shipment.db_id,
                        exfactory_date: shipment.exfactory_date ? formatDateForInput(shipment.exfactory_date) : '',
                        factory_fob: shipment.factory_fob ?? 0,
                        transfer_rate: shipment.transfer_rate ?? 0,
                        ex_factory_exists: shipment.ex_factory_exists ?? false,
                    })) ?? [],
                })) ?? [],
            },
        };
    };

    const methods = useForm<FactoryOrderFormValues>({
    resolver: zodResolver(factoryOrderFormSchema),
        defaultValues: initialData
            ? mapToFormValues(initialData)
            : {
                factoryOrder: {
                    db_id: undefined,
                    order_id: '',
                    factory_name: '',
                    season_name: '',
                    buyer_name: '',
                    order_date: '',
                    factory_order_date: formatDateForInput(new Date()),
                    department: '',
                    remarks: "",
                    currency_id: "1",
                    currency_rate: 1,
                    styles: [],
                },
            },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, trigger, watch, control } = methods;

    // Effect to reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            methods.reset({
                factoryOrder: {
                    ...initialData,
                    db_id: initialData?.id,
                    order_id: initialData.order_id,
                    currency_id: initialData.currency_id?.toString() ?? "1",
                    currency_rate: initialData.currency_rate ?? 1,
                    factory_order_date: initialData.factory_order_date 
                        ? formatDateForInput(new Date(initialData.factory_order_date)) 
                        : formatDateForInput(new Date()),
                    remarks: initialData.remarks ?? "",
                    styles: initialData.styles.map((style: OrderStyle) => ({
                        db_id: style.db_id?.toString(),
                        shipments: style.shipments?.map((shipment: Shipments) => ({
                            db_id: shipment.db_id?.toString(),
                            exfactory_date: shipment.exfactory_date ? formatDateForInput(new Date(shipment.exfactory_date)) : undefined,
                            factory_fob: shipment.factory_fob ?? undefined,
                            transfer_rate: shipment.transfer_rate ?? undefined,
                            ex_factory_exists: shipment.ex_factory_exists ?? false,
                        })) ?? [],
                    })
                )},
            });
        }
    }, [initialData, methods]);

    const orderId = useWatch({ control, name: "factoryOrder.order_id" });

    const { data, isSuccess, isLoading } = api.factoryOrder.getBuyerOrderDetailsByFactoryOrderId.useQuery(
        !!orderId ? { orderId } : skipToken
    );

    useEffect(() => {
        if (!orderId || !isSuccess || !data) return;

        const currentValues = methods.getValues().factoryOrder;

        // Use setValue for top-level fields to avoid nuking the whole state
        methods.setValue("factoryOrder.buyer_name", data.buyer_name ?? "");
        methods.setValue("factoryOrder.factory_name", data.factory_name ?? "");
        methods.setValue("factoryOrder.department", data.department_name ?? "");
        methods.setValue("factoryOrder.season_name", data.season_name ?? "");
        methods.setValue("factoryOrder.order_date", data.order_date ? formatDateForInput(new Date(data.order_date)) : "");

        // For styles, we map the new data but merge it with existing values
        const updatedStyles = data.styles.map((style: OrderDetailsStyle, i: number) => {
            const existingStyle = currentValues.styles?.[i];
            
            return {
                ...style,
                db_id: style.db_id?.toString(),
                fabric_name: style.fabric_name ?? undefined,
                supplier_name: style.supplier_name ?? undefined,
                
                // Merge shipments to preserve exfactory_date, fob, etc.
                shipments: style.shipments?.map((shipment: OrderDetailsShipments, j: number) => {
                    const existingShipment = existingStyle?.shipments?.[j];
                    return {
                        ...shipment,
                        shipment_mode: shipment.shipment_mode ?? undefined,
                        etd_date: shipment.etd_date ? formatDate(new Date(shipment.etd_date)) : "",
                        handover_date: shipment.handover_date ? formatDate(new Date(shipment.handover_date)) : "",
                        shipment_id: shipment?.db_id,
                        delivery_no: shipment.delivery_no ?? undefined,
                        
                        // PRESERVE THESE:
                        db_id: existingShipment?.db_id,
                        exfactory_date: existingShipment?.exfactory_date ?? "",
                        factory_fob: existingShipment?.factory_fob ?? 0,
                        transfer_rate: existingShipment?.transfer_rate ?? 0,
                    };
                }) ?? [],
            };
        });

        methods.setValue("factoryOrder.styles", updatedStyles);

    }, [orderId, isSuccess, data, methods]); 

    const newAvailableOrders = api.factoryOrder.getBuyerOrdersForFactoryOrder.useQuery().data ?? [];

    let availableOrders;

    if(initialData?.order_id && initialData?.ref_no) {
        availableOrders = [{ id: initialData.order_id, ref_no: initialData.ref_no }];
    } else {
        availableOrders = newAvailableOrders;
    }

    const isEdit = !!initialData;

    const formFields = useFormFields(availableOrders ? {availableOrders, isEdit} : {availableOrders: [], isEdit});

    return { methods, handleSubmit, validationError, setFocus, trigger, watch, control, formFields, isLoading };
}

