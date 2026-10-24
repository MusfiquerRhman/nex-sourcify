import { GenericFormTableRow, Portal } from "~/components";
import { type useBuyerOrderForm } from "../../config/useBuyerOrderForm";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";
import { useWatch, type FieldErrors } from "react-hook-form";
import React, { useCallback, useEffect, useState } from "react";
import ColorPopup from "../ColorPopup";
import { api } from "~/trpc/react";
import type { OrderFormValues } from "../../config/formSchema";
import { useModulePermissions } from "~/hooks";

type Props = {
    register: ReturnType<typeof useBuyerOrderForm>['methods']['register'];
    removeRow: (index: number) => void;
    disabled?: boolean;
    name: string;
    index: number;
    methods: ReturnType<typeof useBuyerOrderForm>['methods'];
    validationError: FieldErrors<OrderFormValues['order']>;
    styleIndex: number ;
    copyRow: (index: number) => void;
}

const ShipmentRows = (props: Props) => {
    const { removeRow, disabled = false, name, index, methods, validationError, styleIndex, copyRow } =  props;

    const buyerId = useWatch({ control: methods.control, name: `order.buyer_id` });
    const departmentId = useWatch({ control: methods.control, name: `order.department_id` });
    const exFactoryExists = useWatch({ control: methods.control, name: `order.styles.${styleIndex}.shipments.${index}.ex_factory_exists` });
    const shipmentColors = useWatch({ control: methods.control, name: `order.styles.${styleIndex}.shipments.${index}.colors` }) ?? [];

    const [selectedShipmentIndex, setSelectedShipmentIndex] = useState(0);
    const [openColorModal, setOpenColorModal] = useState(false);
    
    const handleAction = useCallback((shipmentIndex: number) => {
        setOpenColorModal(true);
        setSelectedShipmentIndex(shipmentIndex);
    }, []);

    const colors = api.colors.getAll.useQuery(undefined, { staleTime: 900 * 1000 }).data ?? [];

    useEffect(() => {
        const selectedColors = shipmentColors.map((color) => {
            const colorName = colors.find((option) => option.id === Number(color.color_id))?.name ?? color.color_id;
            return `${colorName} (${color.quantity})`;
        }).join(", ");

        const selectedColorsPath = `order.styles.${styleIndex}.shipments.${index}.selected_colors` as const;
        if (methods.getValues(selectedColorsPath) !== selectedColors) {
            methods.setValue(selectedColorsPath, selectedColors, { shouldDirty: false });
        }
    }, [colors, index, methods, shipmentColors, styleIndex]);

    const { can_delete } = useModulePermissions();

    return (
        <>
            <GenericFormTableRow
                fields={shipmentTableFormFields({buyerId: parseInt(buyerId), departmentId: parseInt(departmentId)})}
                register={methods.register}
                removeRow={removeRow}
                disabled={disabled || exFactoryExists}
                validationError={validationError?.styles?.[styleIndex]?.shipments ?? {}}
                name={name}
                control={methods.control}
                index={index}
                canDelete={can_delete}
                handleAction={handleAction}
                copyRow={copyRow}
            />

            {openColorModal && 
                <Portal containerId="shipment_details_portal">
                    <ColorPopup
                        onClose={() => setOpenColorModal(false)}
                        colorOptions={colors}
                        methods={methods}
                        styleIndex={styleIndex}
                        selectedShipmentIndex={selectedShipmentIndex}
                        disabled={disabled || exFactoryExists}
                    />
                </Portal> 
            }
        </>
    );
}

export default React.memo(ShipmentRows) as typeof ShipmentRows;