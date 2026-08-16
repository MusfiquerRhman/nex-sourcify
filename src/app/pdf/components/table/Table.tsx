import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdfConfig";

type TableProps<T> = {
  columns: {
    key: keyof T | string;
    label: string;
    width?: number; // Optional width in pixels
  }[];
  data: T[];
};

const Table = <T extends Record<string, unknown>>({ columns, data }: TableProps<T>) => {
    // Pre-calculate the column width once, make the report more efficient
    const colWidth = { width: `${1000 / columns.length}` };

    return (
        <View style={styles.tableContainer}>
            <View style={styles.headerRow} fixed>
                {columns.map((column, index) => (
                    <Text key={`h-${index}`} 
                        style={[styles.headerCell, column.width ? { width: `${column.width}px` } : colWidth]}
                    >
                        {column.label}
                    </Text>
                ))}
            </View>

            {/* Body Rows */}
            {data.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row} wrap={false}>
                    {columns.map((column, colIndex) => (
                        <View wrap={true}
                            key={`${rowIndex}-${colIndex}`} 
                            style={[styles.cell, column.width ? { width: `${column.width}px` } : colWidth]} 
                        >
                            <Text hyphenationCallback={
                                (word) => word.split('/').flatMap((part, i, arr) => i < arr.length - 1 ? [part, '/'] : [part])
                            }>
                                {String(row[column.key] ?? '')}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export default Table;