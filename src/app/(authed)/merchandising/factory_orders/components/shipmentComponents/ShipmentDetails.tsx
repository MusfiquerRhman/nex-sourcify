import { useFieldArray, useWatch, type FieldErrors } from "react-hook-form";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import TableForm from "./ShipmentDetailsTableForm";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import { tableFormColumns as shipmentTableFormColumns } from "../../shipmentConfig/tableFormColumns";
import { useEffect, useMemo, memo } from "react";
import { Heading } from "~/components";

type props = {
    styleIndex: number;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues>;
    disabled?: boolean;
}

const ShipmentDetails = (props: props) => {
    const { styleIndex, methods, validationError, disabled = false } = props;

    const { fields: shipmentFields } = useFieldArray<FactoryOrderFormValues>({
        control: methods.control,
        name: `factoryOrder.styles.${styleIndex}.shipments`,
    });
    
    const watchedShipments = useWatch({
        control: methods.control,
        name: `factoryOrder.styles.${styleIndex}.shipments`,
    });

    // Memoize the result to ensure the reference stays stable
    const shipmentsData = useMemo(() => watchedShipments ?? [], [watchedShipments]);

    const styleName = useWatch({ 
        control: methods.control, 
        name: `factoryOrder.styles.${styleIndex}.style` 
    });

    const styleQuantity = useWatch({ 
        control: methods.control, 
        name: `factoryOrder.styles.${styleIndex}.order_quantity` 
    });

    const shipments = useWatch({ 
        control: methods.control, 
        name: `factoryOrder.styles.${styleIndex}.shipments` 
    });

    // Extract FOB and Quantity values for all shipments to use in the effect dependencies
    const shipmentFactoryFobs = useMemo(() => shipmentsData.map(s => s?.factory_fob), [shipmentsData]);
    const shipmentQuantities = useMemo(() => shipmentsData.map(s => s?.lot_quantity), [shipmentsData]);
    const shipmentTransferRate = useMemo(() => shipmentsData.map(s => s?.transfer_rate), [shipmentsData]);

    // Stringify the arrays to use as dependencies in the useEffect hooks, since arrays/objects are reference types
    const shipmentFactoryFobsString = useMemo(() => JSON.stringify(shipmentFactoryFobs), [shipmentFactoryFobs]);
    const shipmentQuantitiesString = useMemo(() => JSON.stringify(shipmentQuantities), [shipmentQuantities]);
    const shipmentTransferRateString = useMemo(() => JSON.stringify(shipmentTransferRate), [shipmentTransferRate]);

    // Auto calculate values when FOB or Quantity change
    useEffect(() => {
        if (!shipments?.length) return;

        shipments.forEach((shipment, index) => {
            if (!shipment?.factory_fob && !shipment?.lot_quantity) return;

            const calculated = ((shipment?.factory_fob ?? 0) * (shipment?.lot_quantity ?? 0)).toFixed(2);

            const current = methods.getValues(
                `factoryOrder.styles.${styleIndex}.shipments.${index}.factory_value`
            );

            if (current !== calculated) {
                methods.setValue(
                    `factoryOrder.styles.${styleIndex}.shipments.${index}.factory_value`,
                    calculated,
                    { shouldDirty: true }
                );
            }
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentFactoryFobsString, shipmentQuantitiesString]);

    // Auto calculate Transfer Values when Transfer Rate changes
    useEffect(() => {
        if (!shipments?.length) return;

        shipments.forEach((shipment, index) => {
            if (!shipment?.transfer_rate && !shipment.factory_value) return;

            const calculated = ((shipment?.transfer_rate ?? 0) * (shipment.lot_quantity ?? 0))?.toFixed(2);
            
            const current = methods.getValues(
                `factoryOrder.styles.${styleIndex}.shipments.${index}.transfer_value`
            );

            if (current !== calculated) {
                methods.setValue(
                    `factoryOrder.styles.${styleIndex}.shipments.${index}.transfer_value`, 
                    calculated,
                    { shouldDirty: true }
                );
            }
        })

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentTransferRateString,  shipmentQuantitiesString]);

    const ShipmentHeading = () => (
        <div className="flex flex-row items-center gap-4">
            <Heading as ='h3' className="mx-8">
                {styleIndex + 1}. PO Details
                {!!styleName && ( 
                    <> of
                        <span className="font-bold rounded-lg bg-primary text-white ml-2 px-3 py-1">
                            {styleName}
                        </span>
                        {!!styleQuantity && 
                            <span className="ml-2">
                                Quantity: <span className="rounded-lg emboss-inner px-3 py-1">
                                    {styleQuantity}
                                </span>
                            </span> 
                        }
                    </>
                ) }
            </Heading>
        </div>
    );

    return (
        <TableForm 
            title={<ShipmentHeading />}
            name={`factoryOrder.styles.${styleIndex}.shipments`}
            rows={shipmentFields}
            columns={shipmentTableFormColumns}
            register={methods.register}
            disabled={disabled}
            methods={methods}
            validationError={validationError}
            styleIndex={styleIndex}
        />
    )
}

export default memo(ShipmentDetails) as typeof ShipmentDetails;