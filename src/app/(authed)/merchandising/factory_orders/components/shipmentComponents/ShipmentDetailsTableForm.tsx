'use client';

import React, { useEffect, useState } from "react";
import { TableBody, TableWrapper } from "~/components";
import { type FieldArrayWithId, type FieldErrors, type FieldValues } from "react-hook-form";
import type { useFactoryOrderForm } from "../../config/useFactoryOrderForm";
import ShipmentRows from "./ShipmentRows";
import ShipmentSummaryRow from "./ShipmentSummaryRow";
import TableHeader, { type TableHeaderType } from "~/components/organisms/table/TableHeader";
import { useDecodedUser } from "~/hooks";
import type { FactoryOrderFormValues } from "../../config/formSchema";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID, MERCHANDISING_DEPARTMENT_ID } from "~/utils/config";

type Props = {
    isLoading?: boolean;
    columns: TableHeaderType<FieldArrayWithId<FactoryOrderFormValues>>[];
    rows: FieldArrayWithId<FactoryOrderFormValues>[];
    disabled?: boolean;
    title: React.JSX.Element;
    name: string;
    methods: ReturnType<typeof useFactoryOrderForm>['methods'];
    validationError: FieldErrors<FactoryOrderFormValues>;
    styleIndex: number;
    register: ReturnType<typeof useFactoryOrderForm>['methods']['register'];
}

const TableForm = (props: Props) => {
    const { title, columns, rows, register, disabled = false, name, methods, validationError, styleIndex } =  props;

    const [canViewTransferRate, setCanViewTransferRate] = useState<boolean>(false);
    
    const { user } = useDecodedUser();
    
    useEffect(() => {
        if(user) {
            if(
                (Number(user.level_id) === ADMIN_LEVEL_ID && Number(user.department_id) === ADMIN_DEPARTMENT_ID) ||
                (Number(user.level_id) === 3 && Number(user.department_id) === MERCHANDISING_DEPARTMENT_ID)
            ) {
                setCanViewTransferRate(true);
            }
        }
    }, [user]);

    const filteredColumns = canViewTransferRate ? columns : columns.filter(
        column => column.key !== 'transfer_rate' && column.key !== 'transfer_value'
    );

    return (
        <>
            {title}

            <form className="flex flex-col justify-start w-full px-8 pb-8">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] items-center gap-4 w-full">
                    <TableWrapper>
                        <TableHeader columns={filteredColumns} rows={rows} />
                        <TableBody>
                            {rows.map((row, index) => (
                                <ShipmentRows
                                    key={row.id}
                                    register={register}
                                    disabled={disabled}
                                    name={name}
                                    index={index}
                                    methods={methods} 
                                    validationError={validationError}
                                    styleIndex={styleIndex}
                                    canViewTransferRate={canViewTransferRate}
                                />
                            ))}
                            <ShipmentSummaryRow methods={methods} 
                                styleIndex={styleIndex} 
                                canViewTransferRate={canViewTransferRate} 
                            />
                        </TableBody>
                    </TableWrapper>
                </div>
            </form>
        </>
    );
}

export default React.memo(TableForm) as typeof TableForm;