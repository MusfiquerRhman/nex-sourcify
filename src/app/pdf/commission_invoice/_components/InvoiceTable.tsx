import { Text, View } from "@react-pdf/renderer";
import TableSummaryRow from "./TableSummaryRow";
import { styles, tableBorderColor } from "../../components/pdfConfig";

const TableHeader = () => (
    <View style={styles.headerRow} fixed>
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
    summaryLabel: string;
    totalQuantity: string;
    totalValue: string;
}

const InvoiceTable = ({ rows, summaryLabel, totalQuantity, totalValue }: InvoiceTableProps) => (
    <View
        style={{
            ...styles.tableContainer,
			fontFamily: 'Roboto',
            borderBottomWidth: 0.75,
            borderBottomColor: tableBorderColor,
        }}
    >
        <TableHeader />

        {rows}

        <TableSummaryRow
            label={summaryLabel}
            quantity={totalQuantity}
            value={totalValue}
        />
    </View>
);

export default InvoiceTable;