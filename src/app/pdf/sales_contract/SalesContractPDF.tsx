import { useMemo } from "react";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle } from "../components";
import { formatDate } from "~/utils/localDateString";
import { authorized } from '~/assets'
import type { inferRouterOutputs } from '@trpc/server';
import type { salesContractsRouter } from "~/server/api";
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof salesContractsRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

type FlatRow =
    | { type: "ref"; ref_no: string }
    | { type: "shipment"; data: any }
    | { type: "subtotal"; results: any };

registerPdfFonts();

const rowStyle = {
    ...styles.row,
    borderRight: 0.75,
    borderRightColor: tableBorderColor,
};

const SalesContractPDF = ({ data }: { data: GetPDFDataOutput }) => {
    const tableColumns = useMemo(() => [
        { key: 'style', label: 'Style', width: 145 },
        { key: 'description', label: 'Description', width: 120 },
        { key: 'buyer_po', label: 'PO', width: 145 },
        { key: 'colors', label: 'Color', width: 108 },
        { key: 'quantity', label: 'Qty/Unit', width: 88 },
        { key: 'transfer_rate', label: 'Price/Unit', width: 78 },
        { key: 'price', label: 'Total Price Per Order Quantity', width: 118 },
        { key: 'destination', label: 'Destination', width: 98 },
        { key: 'exfactory_date', label: 'Delivery Date (Ex-Factory)', width: 98 }
    ], []);

    const useFlattenedRows = (orderData: GetPDFDataOutput['orderData']) => {
        return useMemo(() => {
            const rows: FlatRow[] = [];

            for (const order of orderData) {
            // Reference row
                rows.push({
                    type: "ref",
                    ref_no: order.ref_no,
                });

                // Shipment rows
                for (const shipment of order.shipment_details) {
                    rows.push({
                        type: "shipment",
                        data: {
                            ...shipment,
                            style: String(shipment.style ?? ""),
                            description: String(shipment.description ?? ""),
                            buyer_po: String(shipment.buyer_po ?? ""),
                            colors: String(shipment.colors ?? ""),
                            quantity: String(shipment.quantity ?? ""),
                            transfer_rate: String(shipment.transfer_rate ?? ""),
                            price: String(shipment.price ?? ""),
                            destination: String(shipment.destination ?? ""),
                            exfactory_date: shipment.exfactory_date
                                ? formatDate(new Date(shipment.exfactory_date))
                                : "",
                        },
                    });
                }

                // Subtotal row
                rows.push({
                    type: "subtotal",
                    results: order.results,
                });
            }

            return rows;
        }, [orderData]);
    };

    const useColumnStyles = (columns: any[]) => {
        return useMemo (
            () =>
            columns.map((col) => ({
                ...styles.cell,
                width: col.width,
            })
        ), [columns]);
    };

    const headerStyles = useMemo(() =>
        tableColumns.map((col) => ({
            ...styles.headerCell,
            width: col.width,
            fontFamily: "Amasis",
            fontSize: 9,
        })
    ),[tableColumns]);

    const flattenedRows = useFlattenedRows(data.orderData);
    const columnStyles = useColumnStyles(tableColumns);

    const {user} = useDecodedUser();

    return (
        <Document
            title={data.pdfHeaderData?.sales_contract_no}
            author="Nex Sourcify"
            subject="Sales Contract PDF"
            keywords="Sales, Contract, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
            pageMode='useOutlines'
			creationDate={new Date()}
        >
            <Page orientation="portrait" size="A4" style={styles.body}>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="SALES CONTRACT" />

                {data.pdfHeaderData?.approval_status !== 2 && (
                    <Image
                        object-fit="fill"
                        fixed
                        src={authorized.src}
                        style={styles.pageBackground}
                    />
                )}

                {/* Sales Contract ref and date */}
                <View style={{marginTop: 15}}>
                    <View style={styles.doubleColumnContainer}>
                        <Text style={{...styles.textBold, flex: 3}}>
                            SALES CONTRACT NO: {data.pdfHeaderData?.sales_contract_no}
                        </Text>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                            <Text style={styles.textBold}>SC Date:</Text>
                            <Text style={styles.textAmasis}> {" "}
                                {data.pdfHeaderData?.sales_contract_date 
                                    ? formatDate(new Date(data.pdfHeaderData.sales_contract_date)) 
                                    : ""
                                }
                            </Text>
                        </View>
                    </View>

                    {/* Amendment Information */}
                    {!!data.amendmentData?.amendment_no && 
                        <View style={styles.doubleColumnContainer}>
                            <View style={{flex: 3, display: 'flex', flexDirection: 'row'}}>
                                <Text  style={styles.textBold}>AMENDMENT NO:</Text>
                                <Text style={styles.textAmasis}> {" "}
                                    {data.amendmentData?.amendment_no}
                                </Text>
                            </View>
                            <View style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                                <Text style={styles.textBold}>Amend Date:</Text>
                                <Text style={styles.textAmasis}> {" "}
                                    {formatDate(new Date(data.amendmentData.amendment_date))}
                                </Text>
                            </View>
                        </View>
                    }

                    {/* Buyer Information */}
                    <View style={{...styles.doubleColumnContainer, marginTop: 20}}>
                        <View style={{flex: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Text style={styles.textBold}>BUYER NAME:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.buyer_name}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.buyer_address}</Text>
                        </View>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                            <Text style={styles.textBold}>BUYER BANK:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.buyer_bank_name}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.buyer_bank_address}</Text>
                            <Text style={styles.text}>Account Name: {data.pdfHeaderData?.buyer_bank_account_name}</Text>
                            <Text style={styles.text}>Account No: {data.pdfHeaderData?.buyer_bank_account_no}</Text>
                            <Text style={styles.text}>SWIFT Code: {data.pdfHeaderData?.buyer_bank_swift}</Text>
                        </View>
                    </View>

                    {/* Consignee information */}
                    {data.consigneeData && data.consigneeData.length > 0 &&
                        <View style={{maxWidth: 700}}>
                            <Text style={{...styles.textBold, marginTop: 5}}>CONSIGNEE:</Text>
                            {data.consigneeData?.map((consignee, index) => (
                                <View key={index} style={{marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10}}>
                                    <Text style={{
                                        fontFamily: 'Amasis',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        borderBottomWidth: 0.75,
                                        borderBottomColor: '#ccc',
                                        width: 125,
                                        marginBottom: 3
                                    }}>
                                        {`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}`} Consignee Name:
                                    </Text>
                                    <Text style={styles.textAmasis}>{consignee.consignee_name}</Text>
                                    <Text style={styles.textAmasis}>{consignee.consignee_address}</Text>
                                </View>
                            ))}
                        </View>
                    }

                    {/* Factory Information */}
                    <View style={{...styles.doubleColumnContainer, marginTop: 20}}>
                        <View style={{flex: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Text style={styles.textBold}>SUPPLIER / MANUFACTURER NAME:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.factory_name}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.factory_address}</Text>
                        </View>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                            <Text style={styles.textBold}>SUPPLIER / MANUFACTURER BANK:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.factory_bank_name}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.factory_bank_address}</Text>
                            <Text style={styles.text}>Account Name: {data.pdfHeaderData?.factory_bank_account_name}</Text>
                            <Text style={styles.text}>Account No: {data.pdfHeaderData?.factory_bank_account_no}</Text>
                            <Text style={styles.text}>SWIFT Code: {data.pdfHeaderData?.factory_bank_swift}</Text>
                        </View>
                    </View>

                    {/* Company / buyer nominated agent name */}
                    <View style={{...styles.doubleColumnContainer, marginTop: 20}}>
                        <View style={{flex: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Text style={styles.textBold}>BUYER NOMINATED AGENT NAME:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.company_name}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.company_address}</Text>
                        </View>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                            <Text style={styles.textBold}>BANK DETAILS:</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.company_bank}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.company_bank_address}</Text>
                            <Text style={styles.text}>Account Name: {data.pdfHeaderData?.company_bank_account_name}</Text>
                            <Text style={styles.text}>Account No: {data.pdfHeaderData?.company_bank_account_no}</Text>
                            <Text style={styles.text}>SWIFT Code: {data.pdfHeaderData?.company_bank_swift}</Text>
                        </View>
                    </View>

                    {/* Contact Person Details */}
                    <View style={{maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 15}}>
                        <Text style={styles.textBold}>CONTACT PERSON: {data.pdfHeaderData?.contact_person}</Text>
                        <Text style={styles.textAmasis}>Contact Number: {data.pdfHeaderData?.contact_number}</Text>
                        <Text style={styles.textAmasis}>PABX: {data.pdfHeaderData?.contact_person_pabx}, EXT: {data.pdfHeaderData?.contact_person_ext}</Text>
                        <Text style={styles.textAmasis}>Email: {data.pdfHeaderData?.contact_person_email}</Text>   
                    </View>

                    {/* Negotiation Details */}
                    <Text style={{
                        fontFamily: "Amasis", fontSize: 9, marginTop: 25, fontWeight: 'bold', marginBottom: 5
                    }}>
                        THIS PURCHASE CONTRACT HAS BEEN MADE WITH BUYER AND SUPPLIER AS PER BELOW TERMS AND CONDITIONS:
                    </Text>
                    
                    <View style={styles.doubleColumnContainer}>
                        <View style={{flex: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Text style={styles.textBold}>NEGOTIATION:</Text>
                        </View>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'column'}}>
                            <Text style={styles.text}>{data.pdfHeaderData?.negotiation_bank}</Text>
                            <Text style={styles.text}>{data.pdfHeaderData?.company_bank_address}</Text>
                            <Text style={styles.text}>Account Name: {data.pdfHeaderData?.company_bank_account_name}</Text>
                            <Text style={styles.text}>Account No: {data.pdfHeaderData?.company_bank_account_no}</Text>
                            <Text style={styles.text}>SWIFT Code: {data.pdfHeaderData?.company_bank_swift}</Text>
                            <Text style={styles.text}>Or Any Bank of Bangladesh</Text>
                        </View>
                    </View>

                    {/* Terms and ports */}
                    <View style={{display: 'flex', flexDirection: 'row', marginBottom: 25, marginTop: 5}}>
                        <Text style={styles.textBold}>PAYMENT TERMS: </Text>
                        <Text style={styles.textAmasis}>{data.pdfHeaderData?.payment_terms}</Text>
                    </View>
                    <View style={styles.flex_r_5}>
                        <Text style={styles.textBold}>PARTIAL SHIPMENT OR TRANS SHIPMENT: </Text>
                        <Text style={styles.textAmasis}>{data.pdfHeaderData?.partial_shipment_allowed ? 'ALLOWED' : 'NOT ALLOWED'}</Text>
                    </View>
                    <View style={styles.flex_r_5}>
                        <Text style={styles.textBold}>PORT OF LOADING: </Text>
                        <Text style={styles.textAmasis}>{data.pdfHeaderData?.port_of_loading}</Text>
                    </View>
                    <View wrap={false} style={styles.flex_r_5}>
                        <Text style={styles.textBold}>PORT OF DISCHARGE: </Text>
                        <Text style={{...styles.textAmasis, flexWrap: 'wrap', width: 400}}>ANY PORT OF {data.pdfHeaderData?.final_destination}</Text>
                    </View>
                    <View wrap={false} style={styles.flex_r_5}>
                        <Text style={styles.textBold}>FINAL DESTINATION: </Text>
                        <Text style={{...styles.textAmasis, flexWrap: 'wrap', width: 400}}>{data.pdfHeaderData?.final_destination}</Text>
                    </View>
                    <View style={styles.flex_r_5}>
                        <Text style={styles.textBold}>FREIGHT TERM: </Text>
                        <Text style={styles.textAmasis}>{data.pdfHeaderData?.freight_term}</Text>
                    </View>
                    <View style={styles.flex_r_5}>
                        <Text style={styles.textBold}>DATE AND PLACE OF EXPIRY: </Text>
                        <Text style={styles.textAmasis}>
                            {data.pdfHeaderData?.expiry_date 
                                ? formatDate(new Date(data.pdfHeaderData.expiry_date)) 
                                : ""
                            }
                        </Text>
                    </View>
                    <View style={styles.flex_r_5}>
                        <Text style={styles.textBold}>LAST DATE OF SHIPMENT: </Text>
                        <Text style={styles.textAmasis}>
                            {data.pdfHeaderData?.last_shipment_date 
                                ? formatDate(new Date(data.pdfHeaderData.last_shipment_date)) 
                                : ""
                            }
                        </Text>
                    </View>

                    <Text style={{...styles.textBold, marginTop: 30, marginBottom:10, fontSize: 12}}>
                        GOODS DETAILS:
                    </Text>
                    {/* TABLE GOES HERE */}
                    <View style={styles.tableContainer}>
                        {/* Header */}
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

                        {/* Flat rows */}
                        {flattenedRows.map((row, index) => {
                            // REF ROW
                            if (row.type === "ref") {
                                return (
                                    <View key={`ref-${index}`} style={rowStyle} wrap={false}>
                                        <Text style={styles.salesContractOrderRefs}
                                            {...({ bookmark: row.ref_no } as any)} // Types are outdates in @react-pdf/renderer, so we have to cast it as any
                                        >
                                            {row.ref_no}
                                        </Text>
                                    </View>
                                );
                            }

                            // SHIPMENT ROW
                            if (row.type === "shipment") {
                                return (
                                    <View key={`ship-${index}`} style={styles.row} wrap={false}>
                                    {tableColumns.map((column, i) => (
                                        <View key={column.key} style={{...columnStyles[i], flexWrap: "wrap"}}>
                                            {/* <Text>{row.data[column.key]}</Text> */}
                                            {row.data[column.key]?.split("").map((s: string, idx: number) => {
                                                return <Text key={idx}>{s}</Text>
                                            })}
                                        </View>
                                    ))}
                                    </View>
                                );
                            }

                            // SUBTOTAL ROW
                            if (row.type === "subtotal") {
                                return (
                                    <View
                                        key={`sub-${index}`}
                                        style={[styles.row, { fontWeight: "bold", fontFamily: "Amasis" }]}
                                        wrap={false}
                                    >
                                        <View style={{ ...styles.cell, padding: 4, width: 518 }}>
                                            <Text>SUB TOTAL</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 88 }}>
                                            <Text>{row.results.totalQuantity}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 78 }}>
                                            <Text />
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 118 }}>
                                            <Text>{row.results.totalValue}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 196 }}>
                                            <Text />
                                        </View>
                                    </View>
                                );
                            }

                            return null;
                        })}
                    </View>
                    <View
                        style={[styles.row, { fontWeight: "bold", fontFamily: "Amasis" }]}
                        wrap={false}
                    >
                        <View style={{ ...styles.cell, padding: 4, width: 518 }}>
                            <Text>TOTAL</Text>
                        </View>
                        <View style={{ ...styles.cell, padding: 4, width: 88 }}>
                            <Text>{data.totals.totalQuantity}</Text>
                        </View>
                        <View style={{ ...styles.cell, padding: 4, width: 78 }}>
                            <Text />
                        </View>
                        <View style={{ ...styles.cell, padding: 4, width: 118 }}>
                            <Text>{data.totals.totalValue}</Text>
                        </View>
                        <View style={{ ...styles.cell, padding: 4, width: 196 }}>
                            <Text />
                        </View>
                    </View>

                    <View style={{display: 'flex', flexDirection: 'row', gap: 5, marginTop: 20, marginBottom: 40}}>
                        <Text style={{...styles.textBold}}>IN WORDS ({data.totals.currencyName}):</Text>
                        <Text style={styles.textAmasis}>{data.totals.totalValueInWord}</Text>
                    </View>

                    {/* ADDITIONAL CLAUSES */}
                    {
                        data.additionalClauses.length > 0 && (
                            <View style={{marginTop: 10}} wrap={false}>
                                <Text style={styles.textBold}>ADDITIONAL CLAUSES:</Text>
                                {data.additionalClauses.map((clause, index) => (
                                    <Text key={index} style={{...styles.text, marginLeft: 20}}>
                                        {`${index + 1}. ${clause.additional_clause}`}
                                    </Text>
                                ))}
                            </View>
                        )
                    }

                    {/* BUYER LATE POLICIES */}
                    {
                        data.latePolicies.length > 0 && (
                            <View style={{marginTop: 10}} wrap={false}>
                                <Text style={styles.textBold}>BUYER LATE POLICIES:</Text>
                                {data.latePolicies.map((policy, index) => (
                                    <Text key={index} style={{...styles.text, marginLeft: 20}}>
                                        {`${index + 1}. ${policy.late_policy}`}
                                    </Text>
                                ))}
                            </View>
                        )
                    }
                </View>

                {data.pdfHeaderData?.payment_terms.split('LC')[1] && (
                    <Text style={{marginTop: 20, marginBottom: 20, ...styles.textBold}}>
                        N.B: THIS CONTRACT SHALL BE REPLACED BY EXPORT TT.
                    </Text>
                )}

                <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 50}} wrap={false}>
                    <View style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        marginTop: 50, 
                        borderTop: 0.75, 
                        borderColor: '#000',
                        paddingTop: 2
                    }}>
                        <Text style={styles.textBold}>AUTHORIZED SIGNATURE</Text>
                        <Text style={styles.text}>{data.pdfHeaderData?.company_name}</Text>
                        <Text style={styles.text}>(Supplier - {data.pdfHeaderData?.buyer_name})</Text>
                        <Text style={styles.text}>Date: </Text>
                    </View>
                    <View style={{
                        display: 'flex', 
                        flexDirection: 'column', 
                        marginTop: 50, 
                        borderTop: 0.75, 
                        borderColor: '#000',
                        paddingTop: 2
                    }}>
                        <Text style={styles.textBold}>AUTHORIZED SIGNATURE</Text>
                        <Text style={styles.text}>{data.pdfHeaderData?.factory_name}</Text>
                    </View>
                </View>

                <Text style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) =>
                        `${pageNumber} / ${totalPages}`
                    }
                    fixed
                />
			</Page>
        </Document>
    )
}


export default SalesContractPDF;