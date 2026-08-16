import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, Table, TableSummary } from "../components";
import { useDecodedUser } from "~/hooks";
import type { inferRouterOutputs } from '@trpc/server';
import type { exportSummaryReportRouter } from '~/server/api/routers/reports/exportSummaryReport'

type ExportSummaryReportOutput = inferRouterOutputs<typeof exportSummaryReportRouter>;
type GetPDFDataOutput = ExportSummaryReportOutput['getExportSummary'];

registerPdfFonts();

interface SalesReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
}

const SalesReportPDF = ({ data, base }: SalesReportPDFProps) => {
	const title = `${base === 'LC' ? 'L/C' : 'SALES CONTRACT'} EXPORT SUMMARY`;

	const {user} = useDecodedUser();

	const tableColumns = [
		{ key: 'buyer_name', label: 'Buyer Name', width: 80},
		{ key: 'lc_sc_no', label: `${base === 'LC' ? 'Master LC No' : 'Sales Contract'}`, width: 80 },
		{ key: 'total_order_value', label: `${base === 'LC' ? 'Total Master LC Value' : 'Total Sales Contract Value'}`, width: 80 },
		{ key: 'latest_shipment_date', label: 'Last Ship Date', width: 80 },
		{ key: 'latest_exfactory_date', label: 'Last Ex-factory Date', width: 80 },
		{ key: 'expire_date', label: 'Expire Date', width: 80 },
		{ key: 'total_order_quantity', label: 'Total Order Quantity', width: 80 },
		{ key: 'total_shipped_quantity', label: 'Total Shipped Quantity', width: 80 },
		{ key: 'balance_quantity', label: 'Balance Quantity', width: 80 },
		{ key: 'total_ship_value', label: `${base === 'LC' ? 'Ship Value' : 'Factory Ship Value'}`, width: 90 },
		{ key: 'balance_value', label: 'Balance Shipment Value', width: 80 },
		{ key: 'proceed_amount', label: 'Proceed Amount', width: 80 },
		{ key: 'factory_fdd_value', label: 'Factory FDD Value', width: 80 },
	];

	if(base === 'SC') { 
		tableColumns.splice(11, 0, { key: 'total_rdl_export_value', label: 'Export Value', width: 80 })
	}

	const results = [
		{ label: "Total", value: 'Total', width: 160 },
		{ label: "Total Order Value", value: data.totals.total_order_value, width: 80 },
		{ label: "empty", value: '', width: 240 },
		{ label: "total_order_quantity", value: data.totals.total_order_quantity, width: 80 },
		{ label: "total_shipped_quantity", value: data.totals.total_shipped_quantity, width: 80 },
		{ label: "balance_quantity", value: data.totals.balance_quantity, width: 80 },
		{ label: "total_ship_value", value: data.totals.total_ship_value, width: 90 },
		{ label: "balance_value", value: data.totals.balance_value, width: 80 },
		{ label: "proceed_amount", value: data.totals.proceed_amount, width: 80 },
		{ label: "factory_fdd_value", value: data.totals.factory_fdd_value, width: 80 },
	];

	if(base === 'SC') { 
		results.splice(8, 0, { label: 'total_rdl_export_value', value: data.totals.total_rdl_export_value, width: 80 })
	}

    return (
		<Document
            title={title}
            author="Nex Sourcify"
            subject="Factory Invoice PDF"
            keywords="Factory, Invoice, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<ReportTitle title={title} />
				<View style={{ marginTop: -10, marginBottom: 10 }}>
					<PrintByAndDate />
				</View>

				<Table columns={tableColumns} data={data.table}/>

				<TableSummary results={results}/>

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>	`${pageNumber} / ${totalPages}`}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default SalesReportPDF;