import { ShowPassword, Chip, TableRow, TableCell, CheckBox } from '~/components';
import { formatDate, formatDateTime } from "~/utils/localDateString";
import { commissionIcon, deleteIcon, editIcon, printingIcon, viewIcon } from '~/assets';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

type TableHeader<T> = {
    key: keyof T;
    label: string;
    type?: string;
    chips?: Record<string, { label: string; type: 'success' | 'error' | 'info' | 'warning' }>;
};

type TableRowProps<T extends FieldValues> = {
    type?: string;
    rowData: T;
    columns: TableHeader<T>[];
    editURL?: string;
    deleteFunction?: (id: string) => void;
    allowDelete?: boolean;
    allowEdit?: boolean;
    allowPrint?: boolean;
    allowPrint2?: boolean;
    printURL?: string;
    printURL2?: string;
    view?: boolean;
    control?: Control<T>;
};

// TableRow component to render a row of data based on provided columns and types
const GenericTableRow = <T extends FieldValues>(props: TableRowProps<T>) => {
    const { rowData, columns, editURL, deleteFunction, allowDelete, allowEdit, allowPrint, allowPrint2, printURL, printURL2, view = false, control } = props;
    return (
        <TableRow>
            {columns.map((col, colIndex) => (
                <TableCell key={colIndex} fixedLength={col.type !== 'action'}>
                    {(() => { 
                        switch ((col.type ?? '').toLowerCase()) {
                            case 'date':
                                return <p>{formatDate(rowData[col.key] as Date)}</p>;

                            case 'datetime':
                                return <p>{rowData[col.key] ? formatDateTime(rowData[col.key] as Date) : '-'}</p>;

                            case 'password':
                                return <ShowPassword password={String(rowData[col.key])} />;
                            
                            case 'chip':
                                return (
                                    <Chip label={col.chips?.[String(rowData[col.key])]?.label ?? ''} 
                                        type={col.chips?.[String(rowData[col.key])]?.type} 
                                    />
                                )

                            case 'checkbox':
                                return (
                                    <Controller
                                        name={col.key as Path<T>}
                                        control={control}
                                        render={({ field }) => (
                                            <CheckBox
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                )

                            case 'action':
                                return (allowEdit || allowDelete || view || allowPrint || allowPrint2) ? (
                                    <div className="flex flex-row justify-between items-center h-full text-[0.9rem] border-gray/20 w-fit max-w-25 p-2">
                                        {(!!allowEdit || view) && (
                                            <Link scroll={false} href={`${editURL}/${String(rowData.id)}`}
                                                className="ml-2 w-4 h-full hover:cursor-pointer" 
                                            >
                                                <Image width={20} height={20} src={view ? viewIcon.src : editIcon.src} alt={view ? "View" : "Edit"} />
                                            </Link>
                                        )}
                                        {allowPrint && (
                                            <Link scroll={false} href={`${printURL}/${String(rowData.id)}`}
                                                className="ml-2 w-4 h-full hover:cursor-pointer" 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Image width={20} height={20} src={printingIcon.src} alt="Print" />
                                            </Link>
                                        )}
                                        {allowPrint2 && (
                                            <Link scroll={false} href={`${printURL2}/${String(rowData.id)}`}
                                                className="ml-2 w-4 h-full hover:cursor-pointer" 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Image width={20} height={20} src={commissionIcon.src} alt="Print 2" />
                                            </Link>
                                        )}
                                        {allowDelete && (
                                            <button className="ml-2 w-4 h-full hover:cursor-pointer" 
                                                onClick={() => deleteFunction?.(String(rowData.id))}
                                            >
                                                <Image width={20} height={20} src={deleteIcon.src} alt="Delete" />
                                            </button>
                                        )}
                                    </div>
                                ) : null;

                            default:
                                return (
                                    String(rowData[col.key] ?? "-")
                                )
                        }
                    })()}
                </TableCell>
            ))}
        </TableRow>
    )
};

export default React.memo(GenericTableRow) as typeof GenericTableRow;
