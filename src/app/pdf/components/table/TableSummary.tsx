import { View, Text } from "@react-pdf/renderer"
import { tableBorderColor } from "../pdfConfig"

type resultsType = {
    label: string;
    value: string;
    width: number;
}[];

const TableSummary = ({ results }: { results: resultsType }) => {
    const length = results.length;

    return (
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
                        width: `${field.width ?? 100 / length}%`,
                        borderRight: index !== length - 1 ? `0.75px solid ${tableBorderColor}` : "none",
                        padding: "4px",
                        fontSize: 6, 
                        textAlign: 'center', 
                        fontWeight: 'semibold'
                    }}
                >
                    <Text>{field.value}</Text>
                </View>
            ))}
        </View>
    )
}

export default TableSummary;