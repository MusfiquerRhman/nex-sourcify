import React from "react";
import TableHead from "~/components/atoms/TableHead"
import TableHeadCells from "~/components/atoms/TableHeadCells"

export type TableHeaderType<T> = {
  key: keyof T | (string & {});
  label: string;
  type?: string;
};

type TableHeaderProps<T> = {
    columns: TableHeaderType<T>[]
    rows: T[];
}

const TableHeader = <T,>(props: TableHeaderProps<T>) => {
    const { columns, rows } = props;

    return (
        rows.length !== 0 ? (
            <TableHead>
                <tr>
                    {columns.map((col, index) => (
                        <TableHeadCells key={index} isAction={col.type === 'action'}>
                            {col.label}
                        </TableHeadCells>
                    ))}
                </tr>
            </TableHead>
        ) : (
            <TableHead variant="placeholder">
                <tr className="w-full text-center p-4">
                    <td colSpan={columns.length} className="p-2">No Data</td>
                </tr>
            </TableHead>
        )
    )
}

export default React.memo(TableHeader) as typeof TableHeader;