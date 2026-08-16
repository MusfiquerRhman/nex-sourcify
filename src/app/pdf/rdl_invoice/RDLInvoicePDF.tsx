import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { inferRouterOutputs } from '@trpc/server';
import type { rdlInvoiceRouter } from '~/server/api/routers/commercial/rdlInvoice'; 
import { currencyFormatter } from "~/utils/localNumberStrings";
import { useDecodedUser } from "~/hooks";

type InvoiceOutput = inferRouterOutputs<typeof rdlInvoiceRouter>;

type GetPDFDataOutput = InvoiceOutput['getPDFData'];

registerPdfFonts();

const RDLInvoicePDF = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns = [
		{ key: 'brand', label: 'Brand', width: 250},
		{ key: 'buyer_po', label: 'Order/PO No', width: 250},
		{ key: 'style', label: 'Style No', width: 250},
		{ key: 'invoice_quantity', label: 'Quantity', width: 110 },
		{ key: 'unit_price', label: 'Unit Cost', width: 110 },
		{ key: 'total_price', label: 'Total Cost', width: 110 },
	]

	const isLC = data.header?.lc_no ? true : false;

	const lcTTNo = isLC ? data.header?.lc_no : data.header?.sales_contract_no;
	const lcTTDate = isLC ? formatDate(data.header?.lc_open_date!) : formatDate(data.header?.sales_contract_date!);

	const companyAddress = `${data.header?.company_street ?? ''}${data.header?.company_street ? ', ' : ''}${data.header?.company_city ?? ''}${data.header?.company_city ? ', ' : ''}${data.header?.company_zip_code ?? ''}`;
    
	const {user} = useDecodedUser();

	return (
		<Document
            title={`Nex Sourcify - ${data.header?.invoice_no}`}
            author="Nex Sourcify"
            subject="Factory Invoice PDF"
            keywords="Factory, Invoice, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="portrait" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<ReportTitle title={data.header?.company_name!} />
				<View style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
					<Text style={styles.subtitle}>{`${companyAddress.trim()}`}</Text>
					<Text style={styles.subtitle}>COMMERCIAL INVOICE</Text>
				</View>
				<View style={{ marginTop: -30 }}>
					<PrintByAndDate />
				</View>

				<View style={styles.doubleColumn}>
					{/* Left Column */}
					<View style={{flex: 1, gap: 6}}>
						<View style={styles.textField}>
							<Text style={styles.textAmasis}>{`INVOICE NUMBER :`}</Text>
							<Text style={{...styles.text, ...styles.textBorder}}>
								{`${data.header?.invoice_no ?? ''}`}
							</Text>
						</View>
						<View style={styles.flex_c_5}>
							<Text style={styles.textBold}>{`Beneficiary Name & Address:`}</Text>
							<View style={styles.border}>
								<Text style={{...styles.textAmasis, marginBottom: 2}}>{data.header?.company_name ?? ''}</Text>
								<Text style={{...styles.textAmasis, lineHeight: 1.2}}>{companyAddress.trim()}</Text>
							</View>
						</View>
						<View style={styles.flex_c_5}>
							<Text style={styles.textBold}>{`Buyer Name and Address:`}</Text>
							<View style={styles.border}>
								<Text style={{...styles.textAmasis, marginBottom: 2}}>{data.header?.buyer_name ?? ''}</Text>
								<Text style={{...styles.textAmasis, lineHeight: 1.2}}>{data.header?.buyer_address ?? ''}</Text>
							</View>
						</View>

						<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ...styles.BorderTable}}>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>PI NO:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>CONTAINER NO:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>CONTACT NO:</Text>
							</View>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.pi_no || ' '}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.container_no || ' '}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.contact_no || ' '}</Text>
							</View>
						</View>
				
						<View style={{...styles.flex_c_5, gap: 3}}>
							<Text style={styles.textBold}>{`Beneficiary Bank Details:`}</Text>
							<Text style={{...styles.textAmasis, lineHeight: 1.2}}>
								{data.beneficiaryBankDetails?.name ?? ''}
							</Text>
							<Text style={{...styles.textAmasis, lineHeight: 1.2}}>
								{data.beneficiaryBankDetails?.address ?? ''}
							</Text>
							<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
								<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 2}}>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>ACCOUNT NAME:</Text>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>SWIFT:</Text>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>ACCOUNT NO:</Text>
								</View>
								<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 3}}>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>{data.beneficiaryBankDetails?.account_name ?? ''}</Text>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>{data.beneficiaryBankDetails?.swift?.trim() ?? ''}</Text>
									<Text style={{...styles.textAmasis, marginBottom: 3}}>{data.beneficiaryBankDetails?.account_no ?? ''}</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Right Column */}
					<View style={{flex: 1, gap: 6}}>
						<View style={styles.textField}>
							<Text style={styles.textAmasis}>{`INVOICE DATE :`}</Text>
							<Text style={{...styles.text, ...styles.textBorder}}>
								{`${formatDate(data.header?.invoice_date!) ?? ''}`}
							</Text>
						</View>
						<View style={styles.textField}>
							<Text style={styles.textAmasis}>{`LC/TT No :`}</Text>
							<Text style={{...styles.text, ...styles.textBorder}}>
								{`${lcTTNo ?? ''}`}
							</Text>
						</View>
						<View style={styles.textField}>
							<Text style={styles.textAmasis}>{`LC/TT DATE :`}</Text>
							<Text style={{...styles.text, ...styles.textBorder}}>
								{`${lcTTDate ?? ''}`}
							</Text>
						</View>

						<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ...styles.BorderTable}}>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>PAYMENT TERM:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>TERMS OF DELIVERY:</Text>
							</View>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.term_name ?? ''}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.shipment_mode ?? ''}</Text>
							</View>
						</View>

						<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ...styles.BorderTable}}>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>INCOTERMS:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>COUNTRY OF ORIGIN:</Text>
							</View>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.freight_term_name ?? 'FOB'}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>BANGLADESH</Text>
							</View>
						</View>

						<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ...styles.BorderTable}}>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>PLACE OF RECEIPT:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>PORT OF LOADING:</Text>
							</View>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{' '}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.port_of_loading}</Text>
							</View>
						</View>

						<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ...styles.BorderTable}}>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>FINAL DESTINATION:</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>PORT OF DESTINATION:</Text>
							</View>
							<View style={{...styles.text, display: 'flex', flexDirection: 'column', flex: 1}}>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.final_destination}</Text>
								<Text style={{...styles.BorderTableText, ...styles.textAmasis}}>{data.header?.final_destination}</Text>
							</View>
						</View>
					</View>
				</View>

				<View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 10}}>
					{/* Left Column */}
					<View style={{flex: 1, gap: 6}}>
						{data.header?.consignees && data.header?.consignees.length > 0 &&
							<View>
								<Text style={{...styles.textBold, marginTop: 5}}>CONSIGNEE:</Text>
								{data.header?.consignees?.map((consignee, index) => (
									<View key={index} style={{marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10}}>
										<Text style={{
											fontFamily: 'Amasis',
											fontSize: 10,
											width: 110,
											fontWeight: 'bold',
											borderBottomWidth: 0.75,
											borderBottomColor: '#ccc',
											marginBottom: 3
										}}>
											{`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}`} Consignee Name:
										</Text>
										<Text style={styles.textAmasis}>{consignee?.consignee_name}</Text>
										<Text style={styles.textAmasis}>{consignee?.address}</Text>
									</View>
								))}
							</View>
						}
					</View>

					{/* Right Column */}
					<View style={{flex: 1, gap: 6}}>
						{data.header?.notify_parties && data.header?.notify_parties.length > 0 &&
							<View>
								<Text style={{...styles.textBold, marginTop: 5}}>NOTIFY PARTIES:</Text>
								{data.header?.notify_parties?.map((notify_party, index) => (
									<View key={index} style={{marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10}}>
										<Text style={{
											fontFamily: 'Amasis',
											fontSize: 10,
											width: 120,
											fontWeight: 'bold',
											borderBottomWidth: 0.75,
											borderBottomColor: '#ccc',
											marginBottom: 3
										}}>
											{`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}`} Notify Party Name:
										</Text>
										<Text style={styles.textAmasis}>{notify_party?.consignee_name}</Text>
										<Text style={styles.textAmasis}>{notify_party?.address}</Text>
									</View>
								))}
							</View>
						}
					</View>
				</View>

				<Table columns={tableColumns} data={data.table}/>
				
            	<View style={{
					display: "flex",
					flexDirection: "row",
					borderColor: tableBorderColor,
					borderBottomWidth: 0.5,
					borderLeftWidth: 0.5,
					fontWeight: 'bold',
				}}>
					<View style={{width: 750}}>
						<Text style={{...styles.cell, textAlign: 'right'}}>Total</Text>
					</View>
					<View style={{width: 110}}>
						<Text style={{...styles.cell, textAlign: 'center'}}>{data.table[0]?.total_quantity}</Text>
					</View>
					<View style={{width: 110}}>
						<Text style={styles.cell}>{' '}</Text>
					</View>
					<View style={{width: 110}}>
						<Text style={{...styles.cell, textAlign: 'center'}}>{data.table[0]?.grand_total}</Text>
					</View>
				</View>
				<View style={{
					display: "flex",
					flexDirection: "row",
					borderColor: tableBorderColor,
					borderBottomWidth: 0.5,
					borderLeftWidth: 0.5,
					fontWeight: 'bold',
				}}>
					<View style={{width: 970}}>
						<Text style={{...styles.cell, textAlign: 'right'}}>Less</Text>
					</View>
					<View style={{width: 110}}>
						<Text style={{...styles.cell, textAlign: 'center'}}>{currencyFormatter(data.header?.discount ?? 0, data.table[0]?.symbol ?? '$')}</Text>
					</View>
				</View>
				<View style={{
					display: "flex",
					flexDirection: "row",
					borderColor: tableBorderColor,
					borderBottomWidth: 0.5,
					borderLeftWidth: 0.5,
					fontWeight: 'bold',
				}}>
					<View style={{width: 970}}>
						<Text style={{...styles.cell, textAlign: 'right'}}>Grand Total</Text>
					</View>
					<View style={{width: 110}}>
						<Text style={{...styles.cell, textAlign: 'center'}}>{data.discountedValue}</Text>
					</View>
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
}

export default RDLInvoicePDF;