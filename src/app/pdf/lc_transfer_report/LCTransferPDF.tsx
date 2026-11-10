import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { lcTransferReportRouter } from '~/server/api/routers/reports/lcTransferReport'; 
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof lcTransferReportRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

registerPdfFonts();

const LCTransferPDF = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns = [
		{ key: 'factory_name', label: 'Factory Name', width: 250},
		{ key: 'lc_transfer_value', label: 'Factory Transfer Value', width: 250},
		{ key: 'lc_transfer_quantity', label: 'Factory Transfer Quantity', width: 250},
		{ key: 'lc_transfer_date', label: 'Transfer Date', width: 250},
	]

    const buyerOrderData: HeaderData = [
		[
			{ label: "Buyer Name", value: data.header?.buyer_name ?? '' },
			{ label: "Total Quantity", value: data.header?.lc_quantity ?? '' },
			{ label: "Balance Quantity", value: data.header?.balance_quantity ?? '' },
		],
		[
			{ label: "Master L/C No", value: data.header?.lc_no ?? '' },
			{ label: "Master L/C Value", value: data.header?.lc_value ?? '' },
			{ label: "Balance L/C Value", value: data.header?.balance_value ?? '' },
		]
	];

	const results = [
		{ label: "Total", value: 'Total', width: 250 },
		{ label: "Total_value", value: data.totals.totalValue, width: 250 },
		{ label: "Total_value", value: data.totals.totalQuantity, width: 250 },
		{ label: "", value: '', width: 250 },
	];

	const {user} = useDecodedUser();

    return (
		<Document
            title={`LC Transfer - ${data.header?.lc_no}`}
            author="Nex-Sourcify"
            subject="LC Transfer PDF"
            keywords="LC, Transfer, PDF, Nex-Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex-Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="LC TRANSFER SUMMARY" />
				<HeaderPart data={buyerOrderData}/>
                <View style={{marginTop: 10}}></View>
				<Table columns={tableColumns} data={data.tableData}/>
            	<TableSummary results={results}/>
				<Signature signatures={["Prepared By", "Checked By", "Approved By"]}/>
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

export default LCTransferPDF;