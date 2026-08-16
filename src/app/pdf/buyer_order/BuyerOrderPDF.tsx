import { Document, Page, Text } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { buyerOrdersRouter } from '~/server/api/routers/merchandising/buyerOrders'; 
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof buyerOrdersRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

registerPdfFonts();

const BuyerOrderPDF = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns = [
		{ key: 'style', label: 'Style', width: 150},
		{ key: 'po', label: 'PO', width: 150 },
		{ key: 'size', label: 'Size', width: 80},
		{ key: 'destination_name', label: 'Destination', width: 100 },
		{ key: 'product_name', label: 'Product Name', width: 110 },
		{ key: 'color_names', label: 'Color', width: 110 },
		{ key: 'quantity', label: 'Quantity', width: 110 },
		{ key: 'rdl_fob', label: 'FOB', width: 80 },
		{ key: 'rdl_value', label: 'Value', width: 110 },
	]

    const buyerOrderData: HeaderData = [
		[
			{ label: "Order No", value: data.header[0]?.ref_no ?? '' },
			{ label: "Buyer Name", value: data.header[0]?.buyer_name ?? '' },
			{ label: "Brand Name", value: data.header[0]?.brand_name ?? '' },
			{ label: "Secondary Currency", value: data.header[0]?.currency_name ?? '' },
			{ label: "Season", value: data.header[0]?.season_name ?? '' },
		],
		[
			{ label: "Order Date", value: data.header[0]?.order_date ? formatDate(new Date(data.header[0].order_date)) : ''},
			{ label: "Factory Name", value: data.header[0]?.factory_name ?? '' },
			{ label: "Department Name", value: data.header[0]?.department_name ?? '' },
			{ label: "Currency Rate", value: data.header[0]?.currency_rate ?? '' },
		]
	];

	const results = [
		{ label: "Total", value: 'Total', width: 700 },
		{ label: "Total Quantity", value: data.results.totalQuantityString, width: 110 },
		{ label: "empty", value: '', width: 80 },
		{ label: "Total FOB Value", value: data.results.totalValueString, width: 110 },
	];

	const {user} = useDecodedUser();

    return (
		<Document
            title={`Buyer Order - ${data.header[0]?.ref_no}`}
            author="Nex Sourcify"
            subject="Buyer Order PDF"
            keywords="Buyer, Order, PDF, Nex Sourcify, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="Nex Sourcify"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<NexSourcifyLogo />
				<PrintByAndDate />
				<ReportTitle title="BUYER ORDER" />
				<HeaderPart data={buyerOrderData}/>
				<Table columns={tableColumns} data={data.po_details}/>
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

export default BuyerOrderPDF;