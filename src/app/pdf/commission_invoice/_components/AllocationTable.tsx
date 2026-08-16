import { Text, View } from "@react-pdf/renderer";
import { secondaryTableHeaderColor, tableBorderColor, tableHeaderColor } from "../../components/pdfConfig";

interface AllocationTableProps {
    title: string;
    rows: {
        office: string;
        commission: string;
        percentage: string;
    }[];
    results: {
        total: string;
        totalPercentage: string;
    }
}

const AllocationTable = ({ title, rows, results }: AllocationTableProps) => (
    <View
        style={{
            width: "49%",
        }}
    >
        <View
            style={{
                backgroundColor: secondaryTableHeaderColor,
                paddingLeft: 10,
                paddingTop: 5,
                paddingBottom: 5,
                borderWidth: 1.5,
                borderColor: tableBorderColor,
            }}
        >
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>{title}</Text>
        </View>

        <View
            style={{
                flexDirection: "row",
                backgroundColor: tableHeaderColor,
                borderBottomWidth: 1.5,
                borderBottomColor: tableBorderColor,
                borderLeftWidth: 1.5,
                borderLeftColor: tableBorderColor,
                borderRightWidth: 1.5,
                borderRightColor: tableBorderColor,
            }}
        >
            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    borderRightWidth: 1.5,
                    borderRightColor: tableBorderColor,
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                Name of Office
            </Text>

            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    borderRightWidth: 1.5,
                    borderRightColor: tableBorderColor,
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                Commission
            </Text>

            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                Percentage
            </Text>
        </View>

        {rows.map((row, index) => (
            <View
                key={index}
                style={{
                    flexDirection: "row",
                    borderBottomWidth: 0.75,
                    borderBottomColor: tableBorderColor,
                    borderRightWidth: 0.75,
                    borderRightColor: tableBorderColor,
                }}
            >
                <Text
                    style={{
                        width: "33.33%",
                        padding: 5,
                        textAlign: "center",
                        borderLeftWidth: 0.75,
                        borderLeftColor: tableBorderColor,
                        borderRightWidth: 0.75,
                        borderRightColor: tableBorderColor,
                        fontSize: 9,
                    }}
                >
                    {row.office}
                </Text>

                <Text
                    style={{
                        width: "33.33%",
                        padding: 5,
                        textAlign: "center",
                        borderRightWidth: 0.75,
                        borderRightColor: tableBorderColor,
                        fontSize: 9,
                    }}
                >
                    {row.commission}
                </Text>

                <Text
                    style={{
                        width: "33.33%",
                        padding: 5,
                        textAlign: "center",
                        fontSize: 9,
                    }}
                >
                    {row.percentage}
                </Text>
            </View>
        ))}
        
        <View
            style={{
                flexDirection: "row",
                marginTop: 10,
                borderWidth: 0.75,
                borderColor: tableBorderColor,
            }}
        >
            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    borderRightWidth: 0.75,
                    borderRightColor: tableBorderColor,
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                Total
            </Text>

            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    borderRightWidth: 0.75,
                    borderRightColor: tableBorderColor,
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                {results.total}
            </Text>

            <Text
                style={{
                    width: "33.33%",
                    padding: 4,
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: "bold",
                }}
            >
                {results.totalPercentage}
            </Text>
        </View>
    </View>
);

export default AllocationTable;