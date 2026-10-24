import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { RenaissanceLogo, ReportTitle, HeaderPart, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { commissionInvoiceRouter } from "~/server/api";
import { useDecodedUser } from "~/hooks";
import TableRow from "./_components/TableRow";
import InvoiceTable from "./_components/InvoiceTable";
import { amountToWords, currencyFormatter } from "~/utils/localNumberStrings";
import { safeNumber } from "~/utils/numbers";
import AllocationTable from "./_components/AllocationTable";

type RouterOutput = inferRouterOutputs<typeof commissionInvoiceRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

registerPdfFonts();

const CommissionInvoicePDF = ({ data }: { data: GetPDFDataOutput }) => {
    const today = formatDate(new Date());
    const { user } = useDecodedUser();

    const buyerOrderData: HeaderData = [
        [
            { label: "LC / NexSourcify Ref", value: data.header?.lc_sc_no ?? "" },
            { label: "Buyer Name", value: data.header?.buyer_name ?? "" },
            { label: "Bank Name", value: data.header?.bank_name ?? "" },
            { label: "Exfactory Date", value: data.header?.exfactory_date ?? "" },
        ],
        [
            { label: "Ref No", value: data.header?.ref_no ?? "" },
            {
                label: "Date",
                value: data.header?.invoice_date
                    ? formatDate(new Date(data.header.invoice_date))
                    : "",
            },
            { label: "Month", value: data.header?.month },
            { label: "Bank Ref No", value: data.header?.fdbc_no ?? "" },
        ],
    ];

	const ciAllocationData = [
		{
			office: "Overseas",
			commission: data.formattedCommissionDistribution?.overseas_value ?? '0',
			percentage: data.formattedCommissionDistribution?.overseas_percentage ?? '0',
		},
		{
			office: "Other",
			commission: data.formattedCommissionDistribution?.other_value ?? '0',
			percentage: data.formattedCommissionDistribution?.other_percentage ?? '0',
		},
		{
			office: "Dhaka",
			commission: data.formattedCommissionDistribution?.dhaka_value ?? '0',
			percentage: data.formattedCommissionDistribution?.dhaka_percentage ?? '0',
		},
	];

	const ciAllocationResults = {
		total: data.result.totalCiAllocationValue,
		totalPercentage: data.result.totalCiAllocationPercentage,
	}

	const dnAllocationResults = {
		total: data.result.totalDnAllocationValue,
		totalPercentage: data.result.totalDnAllocationPercentage,
	}

	const dnAllocationData = [
		{
			office: "Overseas",
			commission: data.formattedCommissionDistribution?.dn_overseas_value ?? '0',
			percentage: data.formattedCommissionDistribution?.dn_overseas_percentage ?? '0',
		},
		{
			office: "Other",
			commission: data.formattedCommissionDistribution?.dn_other_value ?? '0',
			percentage: data.formattedCommissionDistribution?.dn_other_percentage ?? '0',
		},
		{
			office: "Dhaka",
			commission: data.formattedCommissionDistribution?.dn_dhaka_value ?? '0',
			percentage: data.formattedCommissionDistribution?.dn_dhaka_percentage ?? '0',
		},
	]

    return (
        <Document
            title={`Commission Invoice - ${data.header?.ref_no}`}
            author="NexSourcify Nexus"
            subject="Commission Invoice PDF"
            keywords="Commission, Invoice, PDF, NexSourcify Nexus, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="NexSourcify Nexus"
            pageMode="useOutlines"
            creationDate={new Date()}
        >
            <Page orientation="portrait" size="A4" style={styles.body} wrap>
                <RenaissanceLogo />

                <ReportTitle title="COMMISSION INVOICE" />

                <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <View
                        style={{
                            width: "100%",
                            textAlign: "right",
                            marginTop: "10px",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 9,
                                fontFamily: "Amasis",
                                marginBottom: 4,
                            }}
                        >
                            Print Date: {today}
                        </Text>
                    </View>
                </View>

                <HeaderPart data={buyerOrderData} variant="between" />

                <InvoiceTable
                    rows={data.formattedRdlInvoices.map((item, index) => (
                        <View key={index}>
							<TableRow
								index={index}
								quantity={item.invoice_quantity}
								value={item.invoice_value}
								description={
									<View style={{ paddingTop: 5, ...(!item.charge && { marginBottom: 5 })}}>
										<Text>NexSourcify Invoice No: {item.invoice_no}</Text>
										<Text style={{ marginTop: 2}}>Date: {item.invoice_date}</Text>
									</View>
								}
							/>
							{item.charge && 
								<TableRow
									quantity={' '}
									value={item.charge}
									description={
										<Text style={{ marginTop: 5 }}>Early Settlement Charge</Text>
									}
								/>
							}
						</View>
                    ))}
                    summaryLabel="Total NexSourcify Invoice Net Quantity and Value"
                    totalQuantity={data.result.rdlInvoiceResults.total_invoice_quantity}
                    totalValue={data.result.rdlInvoiceResults.total_invoice_value}
                />

                <View style={{ marginTop: 10 }}>
                    <InvoiceTable
                        rows={data.formattedFactoryInvoice.map((item, index) => (
                            <TableRow
                                key={index}
                                index={index}
                                quantity={item.invoice_quantity}
                                value={item.invoice_value}
                                description={
                                    <View style={{paddingVertical: 5}}>
                                        <Text>Factory Invoice No: {item.invoice_no}</Text>
                                        <Text style={{ marginTop: 2 }}>Date: {item.invoice_date}</Text>
                                        <Text style={{ marginTop: 2 }}>Factory Name: {item.factory_name}</Text>
                                    </View>
                                }
                            />
                        ))}
                        summaryLabel="Total Factory Invoice Quantity and Value"
                        totalQuantity={data.result.factoryInvoiceResults.total_invoice_quantity}
                        totalValue={data.result.factoryInvoiceResults.total_invoice_value}
                    />
                </View>

				<View style={{
					marginTop: 15,
					display: "flex",
					flexDirection: 'column',
					borderWidth: 0.75,
					borderColor: tableBorderColor,
				}}>
					<View style={{
						display: "flex",
						flexDirection: 'row',
						justifyContent: 'space-between',
					}}>
						<Text style={{ fontSize: 9, fontWeight: "bold", padding: 5, width: 780 }}>
							Net Commission
						</Text>
						<Text style={{ 
							fontSize: 9,
							width: 220, 
							textAlign: "center",  
							paddingTop: 5, 
							paddingBottom: 5,
							paddingLeft: 5,
							borderLeftWidth: 0.75,
							borderLeftColor: tableBorderColor,
						}}>
							{currencyFormatter(data.result.commission, '$')}
						</Text>
					</View>
					<View style={{
						display: "flex",
						flexDirection: 'row',
						borderTopWidth: 0.75,
						borderTopColor: tableBorderColor,
					}}>
						<Text style={{ fontSize: 9, fontWeight: "bold", paddingLeft: 5, paddingTop: 5, paddingBottom: 5 }}>
							USD IN WORDS: {' '}
						</Text>
						<Text style={{ fontSize: 9, paddingTop: 5, paddingBottom: 5 }}>
							{amountToWords(safeNumber(data.result.commission))}
						</Text>
					</View>
				</View>

				<View
					wrap={false}
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						marginTop: 20,
						marginBottom: 20,
					}}
				>
					<AllocationTable
						title="CI Allocation"
						rows={ciAllocationData}
						results={ciAllocationResults}
					/>

					<AllocationTable
						title="DN Allocation"
						rows={dnAllocationData}
						results={dnAllocationResults}
					/>
				</View>

				<View style={{ 
					display: 'flex', 
					flexDirection: 'row', 
					fontSize: 9,
					fontWeight: 'bold',
					borderWidth: 0.75,
					borderColor: tableBorderColor,
				}}>
					<View style={{ 
						width: 520,
						borderRightWidth: 0.75,
						padding: 5,
						borderRightColor: tableBorderColor,
					}}>
						<Text>Grand Total</Text>
					</View>
					<View>
						<View style={{ 
							width: 100,
							padding: 5,
							textAlign: "center",
						}}>
							<Text>
								{data.result.totalValue}
							</Text>
						</View>
					</View>
				</View>

                <Signature
                    signatures={["Prepared By", "Verified By", "Authorized Signature"]}
                />

				<View style={{
					position: "absolute",
					bottom: 30,
					left: 30,
				}}>
					<Text style={{ fontSize: 9, }}>
						Print By: {user?.first_name + ` ` + user?.last_name}
					</Text>
				</View>


                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) =>
                        `${pageNumber} / ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
};

export default CommissionInvoicePDF;
