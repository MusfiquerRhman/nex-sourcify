import type { Control, FieldArrayWithId, UseFormRegister } from "react-hook-form";
import type { FactoryInvoiceDetailsFormValues } from "../../config/formSchema";
import { tableFormColumns } from "../../shipmentConfig/tableFormColumns";
import React from "react";
import { Button, GenericFormTableRow, Heading, Info, Loader, TableBody, TableWrapper } from "~/components";
import TableHeader from "~/components/organisms/table/TableHeader";
import { formFields as shipmentTableFormFields } from "../../shipmentConfig/tableFormFields";

type FactoryInvoiceDetailsFormValuesType = {
    shipments: FactoryInvoiceDetailsFormValues[];
};

interface Props {
    disabled?: boolean;
    onCloseShipmentDetails: () => void;
    addShipmentToTag: () => void;
    shipmentFields: FieldArrayWithId<FactoryInvoiceDetailsFormValuesType, "shipments", "id">[]
    isLoading: boolean;
    shipmentRegister: UseFormRegister<FactoryInvoiceDetailsFormValuesType>;
    control: Control<FactoryInvoiceDetailsFormValuesType, any, FactoryInvoiceDetailsFormValuesType>;
}

const TagShipmentDetails = (props: Props) => {
    const { disabled = false, onCloseShipmentDetails, addShipmentToTag, shipmentFields, shipmentRegister, isLoading, control } = props;

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <Heading as ='h2' className="mx-8">
                        Add Shipments to Factory Invoice
                    </Heading>
        
                    <form className="flex flex-col justify-start w-full px-8 pb-8">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                            <TableWrapper>
                                <TableHeader columns={tableFormColumns} rows={shipmentFields} />
                                <TableBody>
                                    {shipmentFields.map((row, index) => (
                                        <GenericFormTableRow
                                            key={row.id}
                                            fields={shipmentTableFormFields()}
                                            register={shipmentRegister}
                                            disabled={disabled}
                                            validationError={{}}
                                            name={'shipments'}
                                            control={control}
                                            index={index}
                                        />
                                    ))}
                                </TableBody>
                            </TableWrapper>
                        </div>
                    </form>
                                    
                    <div className="w-full flex flex-row justify-between">
                        <div>
                            <Button type="button"
                                onClick={onCloseShipmentDetails}
                                label={"Close"}
                                variant="delete"
                                className="text-lg tracking-wide mt-6 max-w-40 mx-8"
                            />
                            <Info info="You can also click outside the popup box to close the shipment details view." 
                                variant="info"
                                className="px-8 mb-4"
                            />
                        </div>

                        <Button type="button" 
                            onClick={() => addShipmentToTag()}
                            label={"Add shipments in Factory Invoice"} 
                            className="text-lg tracking-wide mt-6 max-w-80 mx-8 h-fit"
                            disabled={ isLoading || disabled}
                        />
                    </div>
                </>
            )}
        </>
    )
}

export default TagShipmentDetails;