import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";
import { useDecodedUser } from "~/hooks";

import type { inferRouterOutputs } from '@trpc/server';
import type { debitNotesRouter } from "~/server/api";

type RouterOutput = inferRouterOutputs<typeof debitNotesRouter>;
type GetPDFDataOutput = RouterOutput['getPDFData'];
type DebitNoteTableRow = GetPDFDataOutput['formattedTable'][number];

registerPdfFonts();

const BlankRow = () => (
	<View style={{ width: 140, borderRight: `0.75px solid ${tableBorderColor}` }}>
		<Text>&nbsp;</Text>
	</View>
)

const LessBlocks = ({text, value}: {text: React.ReactNode, value: string}) => (
	<View style={styles.tableContainer}>
		<View style={{
			flexDirection: 'row', 
			borderLeftWidth: 0.75, 
			borderLeftColor: tableBorderColor,
		}} wrap={false}>
			<View wrap={true}
				style={{ 
					width: 300, 
					fontSize: 9, 
					paddingHorizontal: 5, 
					borderRightWidth: 0.75, 
					borderRightColor: tableBorderColor,
					paddingTop: 10,
				}} 
			>
				<Text>
					{text}
				</Text>
			</View>

			<BlankRow />
			<BlankRow />
			<BlankRow />
			<BlankRow />

			<View style={[styles.cell, { width: 140 }]}>
				<Text style={{ 
					fontWeight: 'bold', 
					fontFamily: 'poppins', 
					paddingTop: 10 
				}}>
					{value}
				</Text>
			</View>
		</View>
	</View>
)

const DebitNotes = ({ data }: { data: GetPDFDataOutput }) => {
	const {user} = useDecodedUser();

	const tableColumns: { key: keyof DebitNoteTableRow; label: string; width: number }[] = [
		{ key: 'buyer_po', label: 'Style and Invoice Number', width: 300},
		{ key: 'quantity', label: 'Quantity (PCS)', width: 140 },
		{ key: 'factory_rate', label: 'LC Transfer Unit Price (USD)', width: 140 },
		{ key: 'transfer_rate', label: 'F. Agreed Unit Price (USD)', width: 140 },
		{ key: 'margin', label: 'Margin Per Unit', width: 140 },
		{ key: 'excess_value', label: 'Total Excess', width: 140 },
	];

	const colWidth = { width: `${1000 / tableColumns.length}` };

    return (
		<Document
            title={`Debit Note - ${data.headerData[0]?.debit_note_ref}`}
            author="Nex Sourcify"
            subject="Debit Note PDF"
            keywords="Debit, Note, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="portrait" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="DEBIT NOTE" />

				{/* Header Information */}
				<Text style={{fontWeight: 'bold', fontSize: 9, letterSpacing: 0.3, fontFamily: 'Roboto'}}>To</Text>
				<View style={{...styles.doubleColumnContainer, marginBottom: 15, fontFamily: 'Roboto'}}>
					<View style={{fontSize: 9, letterSpacing: 0.3}}>
						<Text style={{fontWeight: 'bold'}}>{data.headerData[0]?.factory_name}</Text>
						<Text>{data.headerData[0]?.factory_address}</Text>
					</View>
					<View style={{fontSize: 9, letterSpacing: 0.3}}>
						<View style={{flexDirection: 'row', gap: 5}}>
							<Text style={{fontWeight: 'bold'}}>Ref No:</Text>
							<Text>{data.headerData[0]?.debit_note_ref}</Text>
						</View>
						<View style={{flexDirection: 'row', gap: 5}}>
							<Text style={{fontWeight: 'bold'}}>Date:</Text>
							<Text>{data.headerData[0]?.debit_note_date ? formatDate(data.headerData[0].debit_note_date) : ''}</Text>
						</View>
					</View>
				</View>

				{/* Table */}
				<View style={styles.tableContainer}>
					<View style={styles.headerRow} fixed>
						{tableColumns.map((column, index) => (
							<Text key={`h-${index}`} 
								style={[styles.headerCell, column.width ? { width: `${column.width}px` } : colWidth]}
							>
								{column.label}
							</Text>
						))}
					</View>

					{/* Body Rows */}
					<View style={{borderBottomWidth: 0.75, borderBottomColor: tableBorderColor}}>
						{data.formattedTable.map((row, rowIndex) => (
							<View key={rowIndex} 
								wrap={false}
								style={{
									flexDirection: 'row', 
									borderLeftWidth: 0.75,
									borderLeftColor: tableBorderColor,
								}} 
							>
								{tableColumns.map((column, colIndex) => (
									<View wrap={true}
										key={`${rowIndex}-${colIndex}`} 
										style={[styles.cell, column.width ? { width: `${column.width}px` } : colWidth]} 
									>
										<Text hyphenationCallback={
											(word) => word.split('/').flatMap((part, i, arr) => i < arr.length - 1 ? [part, '/'] : [part])
										}>
											{String(row[column.key] ?? '')}
										</Text>
									</View>
								))}
							</View>
						))}
					</View>
				</View>


				{/* Invoice information, and table summary */}
				<View style={styles.tableContainer}>
					<View style={{
						flexDirection: 'row', 
						borderLeftWidth: 0.75, 
						borderLeftColor: tableBorderColor
					}} wrap={false}>
						<View wrap={true}
							style={{ 
								width: 300, 
								fontSize: 9, 
								paddingHorizontal: 5, 
								borderRightWidth: 0.75, 
								borderRightColor: tableBorderColor 
							}} 
						>
							<View style={{ paddingTop: 3 }}>
								<Text style={{ fontWeight: 'bold', fontFamily: 'Roboto' }}>Invoice No:{'\n'}</Text>
								<View>
									{data.factoryInvoices.map((invoice, index) => (
										<Text key={index}>
											{invoice.factory_invoices}
											{index !== data.factoryInvoices.length - 1 ? ',\n' : ''}
										</Text>
									))}
									<View style={{flexDirection: 'row', gap: 5, marginTop: 15}}>
										<Text style={{fontWeight: 'bold' }}>LC:</Text>
										<Text>{data.headerData[0]?.lc_no}</Text>
									</View>
									<View style={{flexDirection: 'row'}}>
										<Text style={{fontWeight: 'bold' }}>Date: </Text>
										<Text>{data.headerData[0]?.lc_open_date ? formatDate(data.headerData[0].lc_open_date) : ''}</Text>
									</View>
								</View>
							</View>
						</View>

						<View style={[styles.cell, { width: 140 }]}>
							<Text style={{ fontWeight: 'bold', fontFamily: 'poppins' }}>{data.totals.totalQuantity} PCS</Text>
						</View>

						<BlankRow />
						<BlankRow />
						<BlankRow />

						<View style={[styles.cell, { width: 140 }]}>
							<Text style={{ fontWeight: 'bold', fontFamily: 'poppins' }}>{data.totals.totalValue}</Text>
						</View>
					</View>
				</View>

				<LessBlocks 
					text={
						<Text>
							LESS {' '}
							<Text style={{ fontWeight: 'bold' }}>{data.headerData[0]?.additional_adjustment}% {' '}</Text> 
							EARLIER PAYMENT {'\n'}ADJUSTMENT (ON OUR EXCESS VALUE USD {' '}
							<Text style={{ fontWeight: 'bold' }}>{data.totals.totalValue}</Text>)
						</Text>
					}
					value={data.totals.paymentAdjustmentValue}
				/>

				<LessBlocks 
					text={
						<Text>
							LESS {' '}
							<Text style={{ fontWeight: 'bold' }}>{data.headerData[0]?.processing_charge}% {' '}</Text> 
							Processing Charge
						</Text>
					}
					value={data.totals.processingChargeValue}
				/>

				{/* Less Amount*/}
				<LessBlocks
					text={
						<Text>
							LESS AMOUNT{' '}
							<Text style={{ fontWeight: 'bold' }}>{data.totals.lessValue}</Text> 
						</Text>
					}
					value={data.totals.lessValue}
				/>

				{/* Grand Total (USD) */}
				<View wrap={false}
					style={{
						borderBottomWidth: 0.75, 
						borderBottomColor: tableBorderColor, 
						borderTopWidth: 0.75, 
						borderTopColor: tableBorderColor,
						flexDirection: 'row', 
						borderLeftWidth: 0.75, 
						borderLeftColor: tableBorderColor,
					}} 
				>
					<View style={{ 
						width: 300, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5
					}}>
						<Text style={{ fontWeight: 'bold', fontSize: 9 }}>GRAND TOTAL US DOLLAR</Text> 
					</View>

					<BlankRow />
					<BlankRow />
					<BlankRow />
					<BlankRow />

					<View style={[styles.cell, { width: 140 }]}>
						<Text style={{ fontWeight: 'bold', fontFamily: 'poppins' }}>{data.totals.grandTotal}</Text>
					</View>
				</View>

				{/* USD in Word */}
				<View wrap={false}
					style={{
						borderBottomWidth: 0.75, 
						borderBottomColor: tableBorderColor, 
						flexDirection: 'row', 
						borderLeftWidth: 0.75, 
						borderLeftColor: tableBorderColor,
					}} 
				>
					<View style={{ 
						width: 1000, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5
					}}>
						<Text style={{ fontWeight: 'bold', fontFamily: 'poppins', fontSize: 9 }}> USD IN WORD: </Text>
						<Text style={{ fontFamily: 'poppins', fontSize: 9 }}> {data.totals.inWord} </Text>
					</View>
				</View>

				{/* Taka in Word and BDT Total */}
				<View wrap={false}
					style={{
						borderBottomWidth: 0.75, 
						borderBottomColor: tableBorderColor, 
						flexDirection: 'row', 
						borderLeftWidth: 0.75, 
						borderLeftColor: tableBorderColor,
					}} 
				>
					<View style={{ 
						width: 720, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5
					}}>
						<Text style={{ fontWeight: 'bold', fontFamily: 'poppins', fontSize: 9 }}> TAKA IN WORD: {' '}</Text>
						<Text style={{ fontFamily: 'poppins', fontSize: 9, width: 300 }}> {data.totals.inWordBDT} </Text>
					</View>

					<View style={[styles.cell, { width: 280 }]}>
						<Text style={{ fontWeight: 'bold', fontFamily: 'poppins' }}>{data.totals.inBDT}</Text>
					</View>
				</View>

				{/* Currency Rate */}
				<View wrap={false}
					style={{
						borderBottomWidth: 0.75, 
						borderBottomColor: tableBorderColor, 
						flexDirection: 'row', 
						borderLeftWidth: 0.75, 
						borderLeftColor: tableBorderColor,
					}} 
				>
					<View style={{ 
						width: 300, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5
					}}>
						<Text style={{ fontWeight: 'bold', fontSize: 9 }}>CURRENCY RATE</Text> 
					</View>

					<View style={{ 
						width: 210, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5,
						justifyContent: 'center'
					}}>
						<Text style={{ fontWeight: 'bold', fontSize: 9 }}>USD</Text> 
					</View>

					<View style={{ 
						width: 210, 
						flexDirection: 'row', 
						borderRight: `0.75px solid ${tableBorderColor}`, 
						paddingHorizontal: 5, 
						paddingVertical: 5,
						justifyContent: 'center'
					}}>
						<Text style={{ fontWeight: 'bold', fontSize: 9 }}>{data.headerData[0]?.conversion_rate}</Text> 
					</View>

					<BlankRow />
					<BlankRow />
				</View>

				<Signature signatures={[
					"Receiver's\nSignature", 
					"Created By", 
					"Commercial\nChecked By", 
					'Accounts\nChecked By', 
					"Authorized\nSignature"
				]}/>

				<Text style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>
						`${pageNumber} / ${totalPages}`
					}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default DebitNotes;