import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, secondaryTableHeaderColor, styles, tableBorderColor, tableHeaderColor } from "../components/pdfConfig";
import { HeaderPart, PrintByAndDate, NexSourcifyLogo, ReportTitle, Signature, Table, TableSummary } from "../components";
import { useDecodedUser } from "~/hooks";
import type { inferRouterOutputs } from '@trpc/server';
import type { lcScClosingRouter } from '~/server/api/routers/reports/lcScClosing'
import type { HeaderData } from "~/types/pdf";
import { formatDate } from "~/utils/localDateString";
import SettlementType from "./_components/Settlement";
import { safeNumber } from "~/utils/numbers";
import { currencyFormatter } from "~/utils/localNumberStrings";

type LcScClosingReportOutput = inferRouterOutputs<typeof lcScClosingRouter>;
type GetPDFDataOutput = LcScClosingReportOutput['getPDFData'];

registerPdfFonts();

interface LcScClosingReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
	isPartial?: boolean;
}

const chargeColor = (index: number, value: string) => 
	index === 6 ? safeNumber(value) < 0 ? 'red' : 'black'	: index === 5 ? 'black' : 'red';

const LcScClosingPDF = ({ data, base, isPartial }: LcScClosingReportPDFProps) => {
	const title = `STATEMENT OF ${base === 'LC' ? 'LC' : 'SC'} CLOSING`;

	const {user} = useDecodedUser();

	const closingReportHeader: HeaderData = [
		[
			{ label: "Date", value: formatDate(new Date()) ?? '' },
			{ label: "Buyer Name", value: data.header?.buyer_name ?? '' },
			{ label: "Order Quantity", value: data.header?.quantity ?? '' },
			{ label: "Settlement", value: isPartial ? 'Partial' : 'Full' },
		],
		[
			{ label: "LC/SC Number", value: data.header?.lc_no ?? '' },
			{ label: "LC Value in primary currency", value: data.header?.value ?? '' },
			...(data.header?.secondary_value
				? [{ label: "LC Value in secondary currency", value: data.header?.secondary_value ?? '' }]: []
			),
		]
	];

	const hasInvoiceValueColumn = Array.isArray(data.table)
		&& data.table.length > 0
		&& 'invoice_value' in data.table[0]
		&& data.table[0]?.invoice_value != null;

	const tableColumns = [
		{ 
			key: 'invoice_period', 
			label: 'Company Export Invoice Period',
			width: 90.9
		},
		{ 
			key: 'export_invoice_quantity', 
			label: 'Export Invoice Quantity', 
			width: 90.9
		 },
		...(hasInvoiceValueColumn
			? [{ 
				key: 'invoice_value', 
				label: 'Company Export Invoice Value in Primary Currency',
				width: 90.9
			 }]
			: []),
		{ 
			key: 'invoice_value_usd', 
			label: 'Company Export Invoice value in Primary Currency',
			width: 90.9
		 },
		{ 
			key: 'factory_export_value', 
			label: 'Factory Export Invoice Value in Primary Currency', 
			width: 90.9
		 },
		{ 
			key: 'calculated_commission', 
			label: 'Calculated Commission', 
			width: 90.9
		 },
		{ 
			key: 'calculated_commission_percentage', 
			label: 'Calculated Commission Percentage', 
			width: 90.9
		 },
		{ 
			key: 'proceed', 
			label: 'Proceed', 
			width: 90.9
		 },
		{ 
			key: 'factory_payment', 
			label: 'Factory Payment Value', 
			width: 90.9
		 },
		{ 
			key: 'commission_realized', 
			label: 'Commission Realized', 
			width: 90.9
		 },
		{ 
			key: 'commission_realized_percentage', 
			label: 'Commission Realized Percentage', 
			width: 90.9
		 },
	];

	const debitNoteWidth = hasInvoiceValueColumn ? 454.5 : 363.6;

	const debitNoteCommissions: Array<{ label: string; value: string; width: number }> = [
		{ label: "Total", value: 'Calculated Commission Through debit note', width: debitNoteWidth },
		{ label: "Total Quantity", value: String(data.table?.debit_note ?? ''), width: 90.9 },
		{ label: "Total", value: 'Calculated Commission Through debit note', width: 272.7 },
		{ label: "Total FOB Value", value: String(data.table?.debit_note ?? ''), width: 90.9 },
		{ label: "empty", value: '', width: 90.9 },
	];

	const results = [
		{ 
			label: "Total", 
			value: 'Total', 
			width: 90.9 
		},
		{ 
			label: "export_invoice_quantity", 
			value: String(data.table?.export_invoice_quantity ?? ''), 
			width: 90.9 
		},
		...(hasInvoiceValueColumn
			? [{ 
				label: 'invoice_value', 
				value: String(data.table?.invoice_value ?? ''), 
				width: 90.9 
			}]
			: []),
		{ 
			label: "invoice_value_usd", 
			value: String(data.table?.invoice_value_usd ?? ''), 
			width: 90.9 
		},
		{ 
			label: "factory_export_value", 
			value: String(data.table?.factory_export_value ?? ''), 
			width: 90.9 
		},
		{ 
			label: "total_calculated_commission", 
			value: String(data.table_summary?.total_calculated_commission ?? ''), 
			width: 90.9 
		},
		{ 
			label: "total_calculated_commission_percentage", 
			value: String(data.table_summary?.total_calculated_commission_percentage ?? ''), 
			width: 90.9 
		},
		{ 
			label: "proceed", 
			value: String(data.table?.proceed ?? ''), 
			width: 90.9 
		},
		{ 
			label: "factory_payment", 
			value: String(data.table?.factory_payment ?? ''), 
			width: 90.9 
		},
		{ 
			label: "total_commission_realized", 
			value: String(data.table_summary?.total_commission_realized ?? ''), 
			width: 90.9 
		},
		{ 
			label: "total_commission_realized_percentage", 
			value: String(data.table_summary?.total_commission_realized_percentage ?? ''), 
			width: 90.9 
		},
	];

	const chargesTable = [
		{ label: 'BANK CHARGE', value: data.chargesTable.bank_charge },
		{ label: 'DOCUMENT CHARGE', value: data.chargesTable.document_charge },
		{ label: 'DISCOUNT CHARGE', value: data.chargesTable.discount_charge },
		{ label: 'DEDUCTED AS CLAIM ADJUSTMENT', value: data.chargesTable.claim_adjustment },
		{ label: 'GAIN/LOSS DUE TO EXCHANGE RATE', value: data.chargesTable.gain_lose },
		{ label: 'REDUCTION IN FACTORY PAYMENT', value: data.chargesTable.reduction_in_factory_payment },
		{ label: 'Total', value: data.chargesTable.total },
	];

	const commissionDistributionColumns = [
		{ key: 'name', label: 'Name Of Office', width: 90.9 },
		{ key: 'calculated', label: 'Calculate Commission', width: 90.9 },
		{ key: 'percentage', label: 'Percentage', width: 90.9 },
		{ key: 'percentageOfCommission', label: '% of Commission', width: 90.9 },
		{ key: 'actual', label: 'Actual Commission', width: 90.9 },
		{ key: 'actualPercentage', label: 'Actual Commission%', width: 90.9 },
	];

	const commissionDistributionData = [
		{
			name: 'Dhaka',
			calculated: data.commissionTable.dhaka_value,
			percentage: data.commissionTable.dhaka_percentage,
			percentageOfCommission: data.commissionTable.percentage_of_dhaka_commission,
			actual: data.commissionTable.dhaka_actual_commission,
			actualPercentage: data.commissionTable.actual_dhaka_commission_percentage,
		},
		{
			name: 'Overseas',
			calculated: data.commissionTable.overseas_value,
			percentage: data.commissionTable.overseas_percentage,
			percentageOfCommission: data.commissionTable.percentage_of_overseas_commission,
			actual: data.commissionTable.overseas_actual_commission,
			actualPercentage: data.commissionTable.actual_overseas_commission_percentage,
		},
		{
			name: 'Others',
			calculated: data.commissionTable.other_value,
			percentage: data.commissionTable.other_percentage,
			percentageOfCommission: data.commissionTable.percentage_of_other_commission,
			actual: data.commissionTable.other_actual_commission,
			actualPercentage: data.commissionTable.actual_other_commission_percentage,
		},
	];

	const totalCommissionColumns = [
		{ key: 'mode', label: 'Mode Of Payment', width: 181.8 },
		{ key: 'calculated', label: 'Calculated Commission', width: 90.9 },
		{ key: 'actual', label: 'Actual Commission', width: 90.9 },
	];

	const totalCommissionData = [
		{
			mode: 'Through Commission Invoice',
			calculated: data.table?.calculated_commission ?? '',
			actual: data.table?.commission_realized ?? '',
		},
		{
			mode: 'Through Debit Note',
			calculated: data.table?.debit_note ?? '',
			actual: data.table?.debit_note ?? '',
		},
	];

	const commissionDistributionTotal = {
		name: 'Total',
		calculated: data.table_summary?.total_calculated_commission ?? '',
		percentage: data.table_summary?.total_calculated_commission_percentage ?? '',
		percentageOfCommission: '100.00%',
		actual: data.table_summary?.total_commission_realized ?? '',
		actualPercentage: data.table_summary?.total_commission_realized_percentage ?? '',
	};

	const totalCommissionTotal = {
		mode: 'Total',
		calculated: data.table_summary?.total_calculated_commission ?? '',
		actual: data.table_summary?.total_commission_realized ?? '',
	};

	const debitNoteColumns = [
		{ key: 'sl_no', label: 'SL No', width: 54.5 },
		{ key: 'debit_note_ref', label: 'DN No', width: 163.6 },
		{ key: 'debit_note_date', label: 'Date', width: 109.1 },
		{ key: 'factory_name', label: 'Factory Name', width: 227.3 },
		{ key: 'debit_note_value', label: 'Value', width: 90.9 },
	];

	const debitNoteData = (data.debitNotesTable ?? []).map((item, index) => ({
		sl_no: String(index + 1),
		...item,
	}));

	const commissionInvoiceColumns = [
		{ key: 'sl_no', label: 'SL No', width: 54.5 },
		{ key: 'ref_no', label: 'CI No', width: 181.8 },
		{ key: 'invoice_date', label: 'Date', width: 109.1 },
		{ key: 'invoice_value', label: 'Value', width: 90.9 },
	];

	const commissionInvoiceData = (data.commissionInvoiceTable ?? []).map((item, index) => ({
		sl_no: String(index + 1),
		...item,
	}));

	const parseCurrencyValue = (value: string) => safeNumber(value.replace(/[^0-9.-]/g, ''));
	const debitNotesTotal = currencyFormatter(
		debitNoteData.reduce((total, item) => total + parseCurrencyValue(item.debit_note_value), 0),
		'$',
	);
	const commissionInvoicesTotal = currencyFormatter(
		commissionInvoiceData.reduce((total, item) => total + parseCurrencyValue(item.invoice_value), 0),
		'$',
	);
	const commissionInvoicesAndDebitNotesTotal = currencyFormatter(
		parseCurrencyValue(debitNotesTotal) + parseCurrencyValue(commissionInvoicesTotal),
		'$',
	);


    return (
		<Document
            title={title}
            author="Nex-Sourcify"
            subject="Factory Invoice PDF"
            keywords="Factory, Invoice, PDF, Nex-Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex-Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				
				<ReportTitle title={title} />

				<View style={{ marginBottom: 10, marginTop: -20 }}>
					<PrintByAndDate />
				</View>

				<HeaderPart data={closingReportHeader}/>

				<SettlementType isPartial={!!isPartial} />

				<Table columns={tableColumns} data={data.table ? [data.table] : []} />

				<View wrap={false} style={lcStyles.debitNoteCommissionContainer}>
					{debitNoteCommissions.map((field, index) => (
						<View key={index}
							style={{
								...lcStyles.debitNoteCommissionCells, 
								width: `${field.width ?? 100 / length}%`,
								textAlign: index % 2 === 1 ? 'center' : 'right'
							}}
						>
							<Text>{field.value}</Text>
						</View>
					))}
				</View>

				<View wrap={false}
					style={{
						...lcStyles.debitNoteCommissionContainer,
						marginTop: "10px",
						borderTopWidth: 0.5,
						borderTopColor: tableBorderColor,
						fontWeight: 'semibold',
					}}
				>
					{results.map((field, index) => (
						<View key={index}
							style={{
								...lcStyles.debitNoteCommissionCells,
								width: `${field.width ?? 100 / length}%`,
								textAlign: 'center',
							}}
						>
							<Text>{field.value}</Text>
						</View>
					))}
				</View>

				<View style={{
					display: 'flex',
					flexDirection: 'row',
					width: '100%',
					justifyContent: 'space-between',
					gap: 75
				}}>
					<View style={{ marginRight: 10, flex: 3 }}>
						<View style={{
							...lcStyles.chargeTableContainer,
							marginTop: 10
						}}>
							{chargesTable.map((charge, index) => (
								<View key={index} style={lcStyles.chargeTableRows}>
									<Text style={{
										fontSize: 7,
										fontWeight: 'semibold',
										paddingLeft: 3,
									}}>
										{index === 6 ? '' : `${index + 1}. `}{charge.label}
									</Text>
									<Text style={{
										...lcStyles.chargeTableValueCell,
										color: chargeColor(index, charge.value),
										fontWeight: index === 6 ? 'semibold' : 'normal',
									}}>{charge.value}</Text>
								</View>
							))}
						</View>
					</View>

					<View style={lcStyles.differenceContainer}>
						<View style={{
							...lcStyles.differenceText, 
							flex: 4, 
							backgroundColor: tableHeaderColor, 
							borderRightWidth: 0
						}}>
							<Text>Difference between calculated and actual commission</Text>
						</View>
						<View style={{
							...lcStyles.differenceText, 
							flex: 1
						}}>
							<Text>{data.difference_between_commissions}</Text>
						</View>
					</View>
				</View>

				<View style={lcStyles.tablePair} wrap={false}>
					<View style={lcStyles.tableTwoThird}>
						<Table columns={commissionDistributionColumns} data={commissionDistributionData} />
						<View style={lcStyles.totalRow}>
							{commissionDistributionColumns.map((column) => (
								<Text key={column.key} style={{ ...lcStyles.totalCell, width: `${column.width}px` }}>
									{String(commissionDistributionTotal[column.key as keyof typeof commissionDistributionTotal] ?? '')}
								</Text>
							))}
						</View>
					</View>
					<View style={lcStyles.tableHalf}>
						<Text style={lcStyles.sectionTitle}>Total Commission</Text>
						<Table columns={totalCommissionColumns} data={totalCommissionData} />
						<View style={lcStyles.totalRow}>
							{totalCommissionColumns.map((column) => (
								<Text key={column.key} style={{ ...lcStyles.totalCell, width: `${column.width}px` }}>
									{String(totalCommissionTotal[column.key as keyof typeof totalCommissionTotal] ?? '')}
								</Text>
							))}
						</View>
					</View>
				</View>

				<View break style={lcStyles.tablePair}>
					<View style={lcStyles.tableHalf}>
						<Text style={lcStyles.sectionTitle}>Commission Invoices</Text>
						<Table columns={commissionInvoiceColumns} data={commissionInvoiceData} />
						<View style={lcStyles.detailTotalRow}>
							<Text style={lcStyles.detailTotalLabel}>Total</Text>
							<Text style={{...lcStyles.detailTotalValue, width: 65.9}}>{commissionInvoicesTotal}</Text>
						</View>
					</View>
					{debitNoteData.length > 0 && <View style={lcStyles.tableTwoThird}>
						<Text style={lcStyles.sectionTitle}>Debit Notes</Text>
						<Table columns={debitNoteColumns} data={debitNoteData} />
						<View style={lcStyles.detailTotalRow}>
							<Text style={lcStyles.detailTotalLabel}>Total</Text>
							<Text style={{...lcStyles.detailTotalValue, width: 65.9}}>{debitNotesTotal}</Text>
						</View>
					</View>}
				</View>

				<View style={lcStyles.grandDetailTotalRow} wrap={false}>
					<Text style={lcStyles.detailTotalLabel}>Total (Commission Invoices + Debit Notes)</Text>
					<Text style={{...lcStyles.detailTotalValue, width: 150}}>{commissionInvoicesAndDebitNotesTotal}</Text>
				</View>

				<Signature signatures={[
					"Concern Commercial", "Concern Merchandiser", "Authorized Signature", "Authorized Signature"
				]}/>

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>	`${pageNumber} / ${totalPages}`}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default LcScClosingPDF;


const lcStyles = StyleSheet.create({
	tablePair: {
		display: 'flex',
		flexDirection: 'row',
		gap: 18,
		width: '100%',
		marginTop: 10,
	},
	tableHalf: {
		width: '40%'
	},
	tableTwoThird: {
		width: '60%'
	},
	sectionTitle: {
		backgroundColor: secondaryTableHeaderColor,
		borderWidth: 0.5,
		borderColor: tableBorderColor,
		fontSize: 8,
		fontWeight: 'semibold',
		padding: 2,
		textAlign: 'center',
	},
	totalRow: {
		display: 'flex',
		flexDirection: 'row',
		borderWidth: 0.5,
		borderColor: tableBorderColor,
		marginTop: 10,
		fontWeight: 'semibold',
	},
	totalCell: {
		padding: 4,
		fontSize: 8,
		textAlign: 'center',
		borderRightWidth: 0.5,
		borderRightColor: tableBorderColor,
	},
	detailTotalRow: {
		display: 'flex',
		flexDirection: 'row',
		borderWidth: 0.5,
		borderColor: tableBorderColor,
		marginTop: 10,
	},
	grandDetailTotalRow: {
		display: 'flex',
		flexDirection: 'row',
		marginLeft: '25%',
		width: '50%',
		borderWidth: 0.5,
		borderColor: tableBorderColor,
		marginTop: 20,
	},
	detailTotalLabel: {
		flex: 1,
		padding: 4,
		fontSize: 8,
		fontWeight: 'semibold',
		textAlign: 'center',
	},
	detailTotalValue: {
		padding: 4,
		fontSize: 8,
		fontWeight: 'semibold',
		textAlign: 'center',
		borderLeftWidth: 0.5,
		borderLeftColor: tableBorderColor,
	},
	chargeTableContainer: {
		maxWidth: 400,
		borderTopWidth: 0.5,
		borderLeftWidth: 0.5,
		borderRightWidth: 0.5,
		borderTopColor: tableBorderColor,
		borderLeftColor: tableBorderColor,
		borderRightColor: tableBorderColor,
	},
	chargeTableRows: {
		display: 'flex',
		flexDirection: 'row', 
		justifyContent: 'space-between',
		alignItems: 'center',
		borderBottomWidth: 0.5,
		borderBottomColor: tableBorderColor,
	},
	chargeTableLabelCell: {
		width: 320,
		padding: 3,
	},
	chargeTableValueCell: {
		fontSize: 8,
		paddingVertical: 1,
		textAlign: 'center',
		width: 80,
		borderLeftWidth: 0.5,
		borderLeftColor: tableBorderColor,
	},
	differenceContainer: {
		flex: 3, 
		justifyContent: 'flex-end', 
		marginTop: 10,
		alignItems: 'flex-start',
		display: 'flex',
		flexDirection: 'row',
		width: 400,
	},
	differenceText: {
		borderWidth: 0.5,
		borderColor: tableBorderColor,
		fontSize: 8,
		fontWeight: 'semibold',
		paddingVertical: 2,
		paddingHorizontal: 4,
	},
	debitNoteCommissionContainer: {
		flexDirection: "row",
		width: "100%",
		borderBottomWidth: 0.5,
		borderRightWidth: 0.5,
		borderBottomColor: tableBorderColor,
		borderRightColor: tableBorderColor,
	},
	debitNoteCommissionCells: {
		borderLeftWidth: 0.5,
		borderLeftColor: tableBorderColor,
		padding: "4px",
		fontSize: 8, 
		fontFamily: 'Roboto',
	},
});