import { Path, Svg, Text, View } from "@react-pdf/renderer";
import { styles } from "../../components/pdfConfig";
import { formatDate } from "~/utils/localDateString";
import type { GetOrderChecklistPDFDataTypes } from "~/types/qualityAPITypes";
import { formatTechnicalCheck } from "~/utils/orderChecklist";

type ChecklistDetail = GetOrderChecklistPDFDataTypes['details'][number];

type Props = {
    details: ChecklistDetail[];
};

const columns: { key: keyof ChecklistDetail; label: string; width: number }[] = [
    { key: 'serial_no', label: 'SL', width: 4 },
    { key: 'document_details', label: 'Document Details', width: 30 },
    { key: 'technical_check', label: 'Technical', width: 7 },
    { key: 'technical_remarks', label: 'Technical Remarks', width: 16 },
    { key: 'technical_check_date', label: 'Technical Date', width: 10 },
    { key: 'qa_check', label: 'QA', width: 5 },
    { key: 'qa_remarks', label: 'QA Remarks', width: 18 },
    { key: 'qa_check_date', label: 'QA Date', width: 10 },
];

const renderCell = (detail: ChecklistDetail, key: keyof ChecklistDetail) => {
    if (key === 'technical_check') return <Text>{formatTechnicalCheck(detail.technical_check)}</Text>;

    if (key === 'qa_check') {
        return detail[key] ? (
            <Svg width={10} height={10} viewBox="0 0 12 12">
                <Path d="M 2 6 L 5 9 L 10 2" stroke="#000000" strokeWidth={1.5} fill="none" />
            </Svg>
        ) : null;
    }

    if (key === 'technical_check_date' || key === 'qa_check_date') {
        const date = detail[key];
        return <Text>{date ? formatDate(date) : ''}</Text>;
    }

    return <Text>{String(detail[key] ?? '')}</Text>;
};

const ChecklistTable = (props: Props) => {
    const { details } = props;

    return (
        <View style={styles.tableContainer}>
            <View style={styles.headerRow} fixed>
                {columns.map((column) => (
                    <Text key={column.key} style={[styles.headerCell, { width: `${column.width}%` }]}>
                        {column.label}
                    </Text>
                ))}
            </View>
            {details.map((detail) => (
                <View key={detail.id} style={styles.row} wrap={false}>
                    {columns.map((column) => (
                        <View key={column.key} style={[styles.cell, { width: `${column.width}%`, alignItems: 'center', paddingVertical: 2 }]}>
                            {renderCell(detail, column.key)}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export default ChecklistTable;
