import { StyleSheet } from "@react-pdf/renderer";
import { tableBorderColor, tableHeaderColor } from "../components/pdfConfig";

export const pdfStyles = StyleSheet.create({
    companyName: {
        fontFamily: "Amasis",
        fontWeight: 700,
        fontSize: 10,
        textAlign: "center",
        marginTop: 8,
    },
    title: { 
        marginTop: 12 
    },
    reference: { 
        fontFamily: "Amasis", 
        fontSize: 7, 
        marginTop: 4, 
        marginBottom: 8 
    },
    sectionTitle: { 
        fontFamily: "Amasis", 
        fontWeight: 700, 
        fontSize: 10, 
        marginTop: 10, 
        marginBottom: 5 
    },
    table: { 
        borderTopWidth: 0.75, 
        borderLeftWidth: 0.75, 
        borderColor: tableBorderColor, 
        width: "100%" 
    },
    row: { 
        flexDirection: "row", 
        borderBottomWidth: 0.75, 
        borderColor: tableBorderColor 
    },
    headerRow: { 
        flexDirection: "row", 
        backgroundColor: tableHeaderColor, 
        borderBottomWidth: 0.75, 
        borderColor: tableBorderColor 
    },
    headerCell: { 
        fontFamily: "Amasis", 
        fontSize: 8, 
        padding: 4, 
        textAlign: "center", 
        borderRightWidth: 0.75, 
        borderColor: tableBorderColor 
    },
    cell: { 
        fontFamily: "Roboto", 
        fontSize: 7.5, 
        lineHeight: 1.35, 
        padding: 4, 
        textAlign: "center", 
        borderRightWidth: 0.75, 
        borderColor: tableBorderColor 
    },
    approvalColumns: { 
        flexDirection: "row", 
        alignItems: "flex-start", 
        justifyContent: "space-between", 
        gap: 8 
    },
    approvalColumn: { 
        width: "49.3%" 
    },
    approvalName: { 
        width: "73%", 
        textAlign: "left" 
    },
    approvalChoice: { 
        width: "9%", 
        alignItems: "center", 
        justifyContent: "center" 
    },
    paragraph: { 
        marginBottom: 2 
    },
    riskCell: { 
        padding: 3, 
        textAlign: "left" 
    },
    comment: { 
        fontFamily: "Roboto", 
        fontSize: 8.5, 
        lineHeight: 1.45, 
        borderWidth: 0.75,
        borderColor: tableBorderColor, 
        padding: 7 
    },
    photoRow: { 
        flexDirection: "row", 
        borderTopWidth: 0.75, 
        borderLeftWidth: 0.75, 
        borderColor: tableBorderColor, 
        marginBottom: 8 
    },
    photoColumn: { 
        width: "50%", 
        borderRightWidth: 0.75, 
        borderBottomWidth: 0.75, 
        borderColor: tableBorderColor 
    },
    photoCaption: {
        fontFamily: "Amasis",
        fontSize: 8,
        fontWeight: 700,
        textAlign: "center",
        backgroundColor: tableHeaderColor,
        borderBottomWidth: 0.75,
        borderColor: tableBorderColor,
        padding: 4,
    },
    photoGrid: { 
        flexDirection: "row", 
        gap: 4, 
        padding: 4 
    },
    photoSlot: { 
        flex: 1 
    },
    photo: { 
        width: "100%", 
        height: 100, 
        objectFit: "contain" 
    },
    emptyPhoto: { 
        flex: 1, 
        fontFamily: "Roboto", 
        fontSize: 8, 
        color: "#6F6F6F", 
        textAlign: "center", 
        height: 150, 
        paddingTop: 65 
    },
    attendanceFrame: { 
        borderWidth: 0.75, 
        borderColor: tableBorderColor, 
        padding: 6 
    },
    attendancePhoto: { 
        width: "100%", 
        height: 480, 
        objectFit: "contain" 
    },
    emptyText: { 
        fontFamily: "Roboto", 
        fontSize: 8, 
        padding: 6,
        textAlign: "center", 
        color: "#6F6F6F" 
    },
    emptyTableRow: { 
        borderBottomWidth: 0.75, 
        borderRightWidth: 0.75, 
        borderColor: tableBorderColor 
    },
});
 
export const formatPDFDate = (date: Date | null) => {
    return date ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date) : "-";
};

// Keep long identifiers within their cells without adding hyphens to their values.
export const wrapPDFText = (value: string, maxTokenLength: number) => {
    return value.replace(new RegExp(`([^\\s\\-/]{${maxTokenLength}})(?=[^\\s\\-/])`, "gu"), "$1\n");
};
