import { Text, View } from "@react-pdf/renderer";
import { tableBorderColor } from "../../components/pdfConfig";

interface TableRowProps {
    index: number;
    description: React.ReactNode;
    quantity: string;
    value: string;
}

const TableRow = ({ index, description, quantity, value}: TableRowProps) => (
    <View
        style={{
            flexDirection: "row",
            width: "100%",
            borderLeftWidth: 0.75,
            borderLeftColor: tableBorderColor,
            borderRightWidth: 0.75,
            borderRightColor: tableBorderColor,
        }}
        wrap={false}
    >
        <View
            style={{
                width: 100,
                fontSize: 9,
                padding: 5,
                textAlign: "center",
            }}
        >
            <Text>{index + 1}</Text>
        </View>

        <View
            style={{
                width: 400,
                fontSize: 9,
                padding: 5,
                borderLeftWidth: 0.75,
                borderLeftColor: tableBorderColor,
            }}
        >
            {description}
        </View>

        <View
            style={{
                width: 200,
                fontSize: 9,
                padding: 5,
                textAlign: "center",
                borderLeftWidth: 0.75,
                borderLeftColor: tableBorderColor,
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
            }}
        >
            <Text>{value}</Text>
        </View>
    </View>
);

export default TableRow;