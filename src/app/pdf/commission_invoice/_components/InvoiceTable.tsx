import { Text, View } from "@react-pdf/renderer";
import TableSummaryRow from "./TableSummaryRow";
import { styles, tableBorderColor } from "../../components/pdfConfig";

const TableHeader = () => (
    <View style={styles.headerRow}>
        <Text style={[styles.headerCell, { width: 100, padding: 5}]}>
            SL No.
        </Text>
        <Text style={[styles.headerCell, { width: 400, padding: 5}]}>
            Description
        </Text>
        <Text style={[styles.headerCell, { width: 200, padding: 5}]}>
            Quantity (pcs)
        </Text>
        <Text style={[styles.headerCell, { width: 200, padding: 5}]}>
            Total Value (USD)
        </Text>
    </View>
);

interface InvoiceTableProps {
    rows: React.ReactNode[];
    additionalSummaryRows?: { label: string; quantity?: string; value: string }[];
    marginTop?: number;
    summaryLabel: string;
    totalQuantity: string;
    totalValue: string;
}

const InvoiceTable = (props: InvoiceTableProps) => {
    const { rows, additionalSummaryRows, marginTop, summaryLabel, totalQuantity, totalValue } = props;
    const [firstRow, ...remainingRows] = rows;

    return (
        <View
            style={{
                ...styles.tableContainer,
                marginTop,
                fontFamily: 'Roboto',
                borderBottomWidth: 0.75,
                borderBottomColor: tableBorderColor,
            }}
        >
            {rows.length > 0 && (
                <View wrap={false}>
                    <TableHeader />
                    {firstRow}
                </View>
            )}
            {remainingRows}

            {additionalSummaryRows?.map(({ label, quantity, value }) => (
                <TableSummaryRow key={label} label={label} quantity={quantity ?? ""} value={value} />
            ))}
            <TableSummaryRow label={summaryLabel} quantity={totalQuantity} value={totalValue} />
        </View>
    );
};

export default InvoiceTable;
