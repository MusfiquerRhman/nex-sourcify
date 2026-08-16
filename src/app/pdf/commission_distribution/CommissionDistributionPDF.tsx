import { Document, Page, Text } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { commissionDistributionRouter } from "~/server/api";
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof commissionDistributionRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

registerPdfFonts();

const CommissionDistributionPDF = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns = [
		{ key: 'style', label: 'Style', width: 124},
		{ key: 'buyer_po', label: 'PO', width: 124 },
		{ key: 'order_quantity', label: 'Quantity', width: 78 },
		{ key: 'rdl_fob', label: 'FOB', width: 58 },
		{ key: 'rdl_value', label: 'Value', width: 78 },
		{ key: 'factory_fob', label: 'Factory FOB', width: 58 },
		{ key: 'factory_value', label: 'Factory Value', width: 78 },
		{ key: 'commission_percentage', label: 'Commission Percentage', width: 80 },
		{ key: 'commission_value', label: 'Commission Value', width: 80 },
		{ key: 'dhaka_commission', label: 'Dhaka Commission', width: 80 },
		{ key: 'overseas_commission', label: 'Overseas Commission', width: 80 },
		{ key: 'others_commission', label: 'Others Commission', width: 80 },
	];

    const buyerOrderData: HeaderData = [
		[
			{ label: "Buyer Name", value: data.header[0]?.buyer_name ?? '' },
			{ label: "Order No", value: data.header[0]?.ref_no ?? '' },
		],
		[
			{ label: "Order Date", value: data.header[0]?.order_date ? formatDate(new Date(data.header[0].order_date)) : ''},
		]
	];

	const results = [
		{ label: "Total", value: 'Total', width: 248 },
		{ label: "Total Quantity", value: data.results.totalQuantityString, width: 78 },
		{ label: "empty", value: '', width: 58 },
		{ label: "Total FOB Value", value: data.results.totalValueString, width: 78 },
		{ label: "empty", value: '', width: 58 },
		{ label: "Total Factory Value", value: data.results.totalFactoryValueString, width: 78 },
		{ label: "Total Commission Percentage", value: data.results.totalCommissionPercentageString, width: 80 },
		{ label: "Total Commission Value", value: data.results.totalCommissionValueString, width: 80 },
		{ label: "Total Dhaka Commission", value: data.results.totalDhakaCommissionString, width: 80 },
		{ label: "Total Overseas Commission", value: data.results.totalOverseasCommissionString, width: 80 },
		{ label: "Total Others Commission", value: data.results.totalOthersCommissionString, width: 80 },
	];

	const {user} = useDecodedUser();

    return (
		<Document
            title={`Commission Distribution - ${data.header[0]?.ref_no}`}
            author="Nex Sourcify"
            subject="Commission Distribution PDF"
            keywords="Commission, Distribution, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="COMMISSION DISTRIBUTIONS" />
				<HeaderPart data={buyerOrderData}/>
				<Table columns={tableColumns} data={data.details}/>
            	<TableSummary results={results}/>
				<Signature signatures={["Prepared By", "Checked By", "Approved By"]}/>
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

export default CommissionDistributionPDF;