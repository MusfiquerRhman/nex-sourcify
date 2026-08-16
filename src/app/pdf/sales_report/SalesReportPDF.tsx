import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, NexSourcifyLogo, ReportTitle, Table } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { inferRouterOutputs } from '@trpc/server';
import type { salesReportRouter } from '~/server/api/routers/reports/salesReport'
import { useDecodedUser } from "~/hooks";

type SalesReportOutput = inferRouterOutputs<typeof salesReportRouter>;

type GetPDFDataOutput = SalesReportOutput['getSalesReport'];

registerPdfFonts();

interface SelectedFields {
	buyers?: boolean;
	brand?: boolean;
	factory_name?: boolean;
	department?: boolean;
	productTypes?: boolean;
	teams?: boolean;
	quantity?: boolean;
	rdl_value?: boolean;
	factory_value?: boolean;
	commission_value?: boolean;
}

interface SalesReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
	fromDate: string;
	toDate: string;
	selectedFields?: SelectedFields;
}

const SalesReportPDF = ({ data, base, fromDate, toDate, selectedFields }: SalesReportPDFProps) => {
	const width = 1000 / ((selectedFields?.buyers ? 2 : 0) + 
		(selectedFields?.factory_name ? 2 : 0) +
		(selectedFields?.brand ? 1 : 0) + 
		(selectedFields?.department ? 1 : 0) +
		(selectedFields?.productTypes ? 1 : 0) +
		(selectedFields?.teams ? 1 : 0) + 
		(selectedFields?.quantity ? 1 : 0) + 
		(selectedFields?.rdl_value ? 1 : 0) + 
		(selectedFields?.factory_value ? 1 : 0) + 
		(selectedFields?.commission_value ? 1 : 0)
	);

	const tableColumns = [
		...((selectedFields?.buyers) ? [{ key: 'buyer_name', label: 'Buyer', width: width * 2 }] : []),
		...((selectedFields?.factory_name) ? [{ key: 'factory_name', label: 'Factory', width: width * 2 }] : []),
		...((selectedFields?.teams) ? [{ key: 'team_name', label: 'Team', width: width * 1 }] : []),
		...((selectedFields?.brand) ? [{ key: 'brand', label: 'Brand', width: width * 1 }] : []),
		...((selectedFields?.department) ? [{ key: 'department', label: 'Department', width: width * 1 }] : []),
		...((selectedFields?.productTypes) ? [{ key: 'product_type', label: 'Product Type', width: width * 1 }] : []),
		...((selectedFields?.quantity) ? [{ key: 'quantity', label: 'Quantity', width: width }] : []),
		...((selectedFields?.rdl_value) ? [{ key: 'rdl_value', label: 'Value', width: width }] : []),
		...((selectedFields?.factory_value) ? [{ key: 'factory_value', label: 'Factory Value', width: width }] : []),
		...((selectedFields?.commission_value) ? [{ key: 'commission_value', label: 'Commission Value', width: width }] : []),
	]

	const tableWidth = tableColumns.reduce((total, column) => total + (column.width ?? 1000 / tableColumns.length), 0);
	
	const summaryValueWidth =
		(selectedFields?.quantity ? width : 0) +
		(selectedFields?.rdl_value ? width : 0) +
		(selectedFields?.factory_value ? width : 0) +
		(selectedFields?.commission_value ? width : 0);

	const summaryLabelWidth = Math.max(tableWidth - summaryValueWidth, 0);

	const results = [
		{ label: "Total", value: 'Total', width: summaryLabelWidth },
		...((selectedFields?.quantity && data.totals.quantity !== undefined) 
			? [{ label: "Total Quantity", value: String(data.totals.quantity), width: width }] : []
		),
		...((selectedFields?.rdl_value && data.totals.rdl_value !== undefined) 
			? [{ label: "Total FOB Value", value: String(data.totals.rdl_value), width: width }] : []
		),
		...((selectedFields?.factory_value && data.totals.factory_value !== undefined) 
			? [{ label: "Total Factory Value", value: String(data.totals.factory_value), width: width }] : []
		),
		...((selectedFields?.commission_value && data.totals.commission_value !== undefined) 
			? [{ label: "Total Commission Value", value: String(data.totals.commission_value), width: width }] : []
		),
	];

	const title = `SALES REPORT BASED ON ${base} DATE`;

	const {user} = useDecodedUser();

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
				<View style={{ marginTop: -20 }}>
					<PrintByAndDate />
				</View>

				<View style={{
					display: 'flex',
					flexDirection: 'row',
					marginBottom: 10,
					marginTop: 10,
					fontSize: 10,
					paddingLeft: 5,
					paddingRight: 5,
					border: `1px solid ${tableBorderColor}`,
				}}>
					<Text style={{ 
						flex: 1,
						paddingTop: 2,
						paddingBottom: 2,
					}}>
						Sales Period
					</Text>
					<Text style={{ 
						flex: 6, 
						borderLeft: `1px solid ${tableBorderColor}`, 
						paddingLeft: 5, 
						paddingTop: 2,
						paddingBottom: 2,
					}}>
						{formatDate(new Date(fromDate))} - {formatDate(new Date(toDate))}
					</Text>
				</View>

				<Table columns={tableColumns} data={data.salesReportData}/>

				<View
					wrap={false}
					style={{
						flexDirection: "row",
						marginTop: "10px",
						width: "100%",
						border:  `0.75px solid ${tableBorderColor}`,
					}}
				>
					{results.map((field, index) => (
						<View
							key={index}
							style={{
								width: `${field.width ?? 100 / length}px`,
								borderLeft: index !== length - 1 ? `0.75px solid ${tableBorderColor}` : "none",
								padding: "4px",
								fontSize: 8, 
								textAlign: 'center', 
								fontWeight: 'semibold'
							}}
						>
							<Text>{field.value}</Text>
						</View>
					))}
				</View>

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