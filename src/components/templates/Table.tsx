import { Loader, TableFooter, TableWrapper, TableBody, GenericTableRow } from "~/components";
import TableHeader, { type TableHeaderType } from "../organisms/table/TableHeader";
import React from "react";

type TableProps<T extends Record<string, unknown>> = {
    data: T[] | undefined;
    columns: TableHeaderType<T>[];
    isLoading: boolean;
    nextPage: () => void;
    prevPage: () => void;
    page: number;
    limit: number;
    total: number;
    editURL?: string;
    deleteFunction?: (id: string) => void;
    allowDelete?: boolean;
    allowEdit?: boolean;
    allowPrint?: boolean;
    printURL?: string;
    allowPrint2?: boolean;
    printURL2?: string;
    view?: boolean;
};

// Table component to render data in tabular format with pagination
const Table = <T extends Record<string, unknown>>( props: TableProps<T>) => {
    const { 
        data, 
        columns, 
        isLoading, 
        nextPage, 
        prevPage, 
        page, 
        limit, 
        total, 
        editURL, 
        deleteFunction, 
        allowDelete, 
        allowPrint, 
        printURL, 
        allowPrint2, 
        printURL2, 
        allowEdit, 
        view 
    } = props;

    if (isLoading) return <Loader />;

    if(!data || data.length === 0) {
        return <div className="p-4 text-center">No data available.</div>;
    }

    const renderedColumns = React.useMemo(() => {
        if (!allowDelete && !allowEdit && !view) {
            return columns.filter(col => col.type !== "action");
        }
        return columns;
    }, [columns, allowDelete, allowEdit, view]);

    return (
        <div>
            <TableWrapper>
                <TableHeader columns={renderedColumns} rows={data} />
                <TableBody>
                    {data?.map((row, rowIndex) => (
                        <GenericTableRow key={rowIndex} 
                            rowData={row} 
                            columns={renderedColumns} 
                            editURL={editURL} 
                            view={view}
                            deleteFunction={deleteFunction} 
                            allowDelete={allowDelete}
                            allowPrint={allowPrint}
                            printURL={printURL}
                            allowPrint2={allowPrint2}
                            printURL2={printURL2}
                            allowEdit={allowEdit}
                        />
                    ))}
                </TableBody>
            </TableWrapper>
            <TableFooter 
                page={page}
                limit={limit}
                total={total}
                prevPage={prevPage}
                nextPage={nextPage}
            />
        </div>
    )
};

export default React.memo(Table) as typeof Table;