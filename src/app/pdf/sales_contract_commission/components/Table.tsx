import { Text, View } from "@react-pdf/renderer";
import { useMemo } from "react";
import { styles, tableBorderColor } from "../../components/pdfConfig";
import type { inferRouterOutputs } from '@trpc/server';
import type { salesContractsRouter } from "~/server/api";
import { formatDate } from "~/utils/localDateString";

type RouterOutput = inferRouterOutputs<typeof salesContractsRouter>;

type GetPDFDataOutput = NonNullable<RouterOutput['getSalesContractCommissionPDFData']['nonAmendData']>;

type TableColumns = {
    key: string;
    label: string;
    width: number;
}[];

const rowStyle = {
    ...styles.row,
    borderRight: 0.75,
    borderRightColor: tableBorderColor,
};

type FlatRow =
    | { type: "ref"; ref_no: string }
    | { type: "shipment"; data: any }
    | { type: "subtotal"; results: any }
    | { type: "grandtotal"; results: any };

const TableHeaders = ({ tableColumns }: { tableColumns: TableColumns }) => {
    const headerStyles = useMemo(() =>
        tableColumns.map((col) => ({
            ...styles.headerCell,
            width: col.width,
            fontFamily: "Amasis",
            fontSize: 9,
        })
    ),[tableColumns]);

    return (
        <View style={styles.headerRow} fixed>
            {tableColumns.map((column, i) => (
                <Text
                    key={column.key}
                    style={headerStyles[i]}
                >
                    {column.label}
                </Text>
            ))}
        </View>
    )
}

interface SalesContractCommissionTableProps {
    data: GetPDFDataOutput;
    grandTotal?: any;
    amendment_no?: number;
    amendment_date?: Date;
}

const SalesContractCommissionTable = ({data, grandTotal, amendment_no, amendment_date}: SalesContractCommissionTableProps) => {
    const tableColumns = useMemo(() => [
        { key: 'style', label: 'Style', width: 123.3 },
        { key: 'buyer_po', label: 'PO', width: 123.3 },
        { key: 'quantity', label: 'Qty/Unit', width: 83.3 },
        { key: 'fob_rate', label: 'NexSourcify FOB', width: 40.9 },
        { key: 'rdl_value', label: 'NexSourcify Value', width: 83.3 },
        { key: 'factory_rate', label: 'Fac FOB', width: 40.9 },
        { key: 'factory_value', label: 'Factory Value', width: 83.3 },
        { key: 'commissionValue', label: 'Commission Value', width: 83.3 },
        { key: 'commissionPercentage', label: 'Commission Percentage', width: 83.3 },
        { key: 'overseasCommission', label: 'Overseas Commission', width: 83.3 },
        { key: 'othersCommission', label: 'Other Commission', width: 83.3 },
        { key: 'dhakaCommission', label: 'NexSourcify Commission', width: 83.3 },
    ], []);

    const useColumnStyles = (columns: any[]) => {
        return useMemo (
            () =>
            columns.map((col) => ({
                ...styles.cell,
                width: col.width,
            })
        ), [columns]);
    };

    const useFlattenedRows = (orderData: GetPDFDataOutput, total: any) => {
        return useMemo(() => {
            const rows: FlatRow[] = [];

            for (const order of orderData ?? []) {
            // Reference row
                rows.push({
                    type: "ref",
                    ref_no: order.ref_no ?? '',
                });

                // Shipment rows
                for (const shipment of order.shipment_details ?? []) {
                    rows.push({
                        type: "shipment",
                        data: {
                            ...shipment,
                            style: String(shipment.style ?? ""),
                            buyer_po: String(shipment.buyer_po ?? ""),
                            quantity: String(shipment.quantity ?? ""),
                            fob_rate: String(shipment.fob_rate ?? ""),
                            rdl_value: String(shipment.rdl_value ?? ""),
                            factory_rate: String(shipment.factory_rate ?? ""),
                            factory_value: String(shipment.factory_value ?? ""),
                            commissionValue: String(shipment.commissionValue ?? ""),
                            commissionPercentage: String(shipment.commissionPercentage ?? ""),
                            overseasCommission: String(shipment.overseasCommission ?? ""),
                            othersCommission: String(shipment.othersCommission ?? ""),
                            dhakaCommission: String(shipment.dhakaCommission ?? ""),
                        },
                    });
                }

                // Subtotal row
                rows.push({
                    type: "subtotal",
                    results: order.results,
                });
            }

            if (total) {
                rows.push({
                    type: "grandtotal",
                    results: total,
                });
            }

            return rows;
        }, [orderData, total]);
    };
    
    const columnStyles = useColumnStyles(tableColumns);
    const flattenedRows = useFlattenedRows(data, grandTotal);

    return (
        <View style={{...styles.tableContainer, marginTop: 10}}>
            {amendment_no && amendment_date && (
                <View style={{marginTop: 15}}>
                    <View style={styles.doubleColumnContainer}>
                        <Text style={{...styles.textBold, flex: 3}}>
                            SALES CONTRACT AMENDMENT NO: {amendment_no}
                        </Text>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                            <Text style={styles.textBold}>Amendment Date:</Text>
                            <Text style={styles.textAmasis}> {" "}
                                {amendment_date 
                                    ? formatDate(new Date(amendment_date)) 
                                    : ""
                                }
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <TableHeaders tableColumns={tableColumns} />
                    
            {flattenedRows.map((row, index) => {
                // REF ROW
                if (row.type === "ref") {
                    return (
                        <View key={`ref-${index}`} style={rowStyle} wrap={false}>
                            <Text style={styles.salesContractOrderRefs}
                                // Types are outdates in @react-pdf/renderer, so we have to cast it as any
                                {...({ bookmark: row.ref_no } as any)} 
                            >
                                {row.ref_no}
                            </Text>
                        </View>
                    );
                }

                // SHIPMENT ROW
                else if (row.type === "shipment") {
                    return (
                        <View key={`ship-${index}`} style={styles.row} wrap={false}>
                        {tableColumns.map((column, i) => (
                            <View key={column.key} style={{...columnStyles[i], flexWrap: "wrap"}}>
                                {/* {row.data[column.key]} */}
                                <Text>
                                    {String(row.data[column.key] ?? '')}
                                </Text>
                            </View>
                        ))}
                        </View>
                    );
                }

                // SUBTOTAL ROW
                else if (row.type === "subtotal") {
                    return (
                        <View
                            key={`sub-${index}`}
                            style={[styles.row, { fontWeight: "bold", fontFamily: "Amasis" }]}
                            wrap={false}
                        >
                            <View style={{ ...styles.cell, padding: 4, width: 246.6 }}>
                                <Text>SUB TOTAL</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalQuantity}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                <Text />
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalRdlValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                <Text />
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalFactoryValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalCommissionValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.commissionPercentage}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalOverseasCommission} (${row.results.totalOverseasCommissionPercentage})`}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalOthersCommission} (${row.results.totalOthersCommissionPercentage})`}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalDhakaCommission} (${row.results.totalDhakaCommissionPercentage})`}</Text>
                            </View>
                        </View>
                    );
                }

                // GRAND TOTAL ROW
                else if (row.type === "grandtotal") {
                    return (
                        <View
                            key={`grand-${index}`}
                            style={[styles.row, { fontWeight: "bold", fontFamily: "Amasis" }]}
                            wrap={false}
                        >
                            <View style={{ ...styles.cell, padding: 4, width: 246.6 }}>
                                <Text>GRAND TOTAL</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalQuantity}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                <Text />
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalRdlValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                <Text />
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalFactoryValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.totalCommissionValue}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{row.results.commissionPercentage}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalOverseasCommission} (${row.results.totalOverseasCommissionPercentage})`}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalOthersCommission} (${row.results.totalOthersCommissionPercentage})`}</Text>
                            </View>

                            <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                <Text>{`${row.results.totalDhakaCommission} (${row.results.totalDhakaCommissionPercentage})`}</Text>
                            </View>
                        </View>
                    );
                }

                return null;
            })}
        </View>
    )
}

export default SalesContractCommissionTable;