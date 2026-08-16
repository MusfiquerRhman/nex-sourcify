import { Document, Page, Text } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { factoryOrderRouter } from "~/server/api";
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof factoryOrderRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

registerPdfFonts();

const FactoryOrderPDF = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns = [
		{ key: 'style', label: 'Style', width: 120},
		{ key: 'po', label: 'PO', width: 120 },
		{ key: 'size', label: 'Size', width: 63},
		{ key: 'destination_name', label: 'Destination', width: 74.7 },
		{ key: 'product_name', label: 'Product Name', width: 86.6 },
		{ key: 'color_names', label: 'Color', width: 86.6 },
		{ key: 'quantity', label: 'Quantity', width: 78.7 },
		{ key: 'rdl_fob', label: 'FOB', width: 63 },
		{ key: 'rdl_value', label: 'Value', width: 86.6 },
		{ key: 'factory_fob', label: 'Factory Rate', width: 63 },
		{ key: 'factory_value', label: 'Factory Value', width: 78.7 },
		{ key: 'exfactory_date', label: 'Ex Factory Date', width: 78.7 },
	]

    const factoryOrderData: HeaderData = [
		[
			{ label: "Order No", value: data.header[0]?.ref_no ?? '' },
			{ label: "Buyer Name", value: data.header[0]?.buyer_name ?? '' },
			{ label: "Brand Name", value: data.header[0]?.brand_name ?? '' },
			{ label: "Department Name", value: data.header[0]?.department_name ?? '' },
			{ label: "Season", value: data.header[0]?.season_name ?? '' },
			{ label: "Team Name", value: data.header[0]?.team_name ?? '' },
		],
		[
			{ label: "Order Date", value: data.header[0]?.order_date 
				? formatDate(new Date(data.header[0].order_date)) : ''
			},
			{ label: "Factory Name", value: data.header[0]?.factory_name ?? '' },
			{ label: "Payment Term", value: data.header[0]?.payment_term ?? '' },
			{ label: "FOB Type", value: data.header[0]?.fob_type ?? '' },
			{ label: "Currency", value: data.header[0]?.currency_name ?? '' },
			{ label: "Currency Rate", value: data.header[0]?.currency_rate ?? '' },
		]
	];

	const results = [
		{ label: "Total", value: 'Total', width: 550.9 },
		{ label: "Total Quantity", value: data.results.totalQuantity, width: 78.7 },
		{ label: "empty", value: '', width: 63 },
		{ label: "Total FOB Value", value: data.results.totalValue, width: 86.6 },
		{ label: "empty", value: '', width: 63 },
		{ label: "Total Factory Value", value: data.results.totalFactoryValue, width: 78.7 },
		{ label: "empty", value: '', width: 78.7 },
	];

	const {user} = useDecodedUser();

    return (
		<Document
            title={data.header[0]?.ref_no ?? 'factory_order'}
            author="Nex Sourcify"
            subject="Factory Order PDF"
            keywords="Factory, Order, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="FACTORY ORDER" />
				<HeaderPart data={factoryOrderData}/>
				<Table columns={tableColumns} data={data.po_details}/>
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

export default FactoryOrderPDF;