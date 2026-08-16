import { Text, View } from "@react-pdf/renderer";
import { tableBorderColor } from "../../components/pdfConfig";

interface TableSummaryRowProps {
    label: string;
    quantity: string;
    value: string;
}

const TableSummaryRow = ({ label, quantity, value }: TableSummaryRowProps) => (
    <View
        style={{
            flexDirection: "row",
            width: "100%",
            borderTopWidth: 0.75,
            borderTopColor: tableBorderColor,
            borderLeftWidth: 0.75,
            borderLeftColor: tableBorderColor,
            borderRightWidth: 0.75,
            borderRightColor: tableBorderColor,
        }}
        wrap={false}
    >
        <View
            style={{
                width: 500,
                fontSize: 9,
                padding: 5,
                fontWeight: "bold",
            }}
        >
            <Text>{label}</Text>
        </View>

        <View
            style={{
                width: 200,
                fontSize: 9,
                padding: 5,
                textAlign: "center",
                borderLeftWidth: 0.75,
                borderLeftColor: tableBorderColor,
                fontWeight: "bold",
            }}
        >
            <Text>{quantity}</Text>
        </View>

        <View
            style={{
                width: 200,
                fontSize: 9,
                padding: 5,
                textAlign: "center",
                borderLeftWidth: 0.75,
                borderLeftColor: tableBorderColor,
                fontWeight: "bold",
            }}
        >
            <Text>{value}</Text>
        </View>
    </View>
);


export default TableSummaryRow;