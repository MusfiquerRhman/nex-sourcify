import { StyleSheet } from "@react-pdf/renderer";
import { styles, tableBorderColor, tableHeaderColor } from "../components/pdfConfig";

const sectionBorderWidth = 0.75;
const sectionPadding = 5;
const pageContentWidth = 595.28 - styles.body.paddingHorizontal * 2;

export const regularPhotoBounds = { width: pageContentWidth - (sectionBorderWidth + sectionPadding) * 2, height: 100 };
// Fit portrait A4 after the shared page padding, 37pt logo, and 6pt image gap.
export const additionalPhotoBounds = { width: pageContentWidth, height: 841.89 - styles.body.paddingTop - styles.body.paddingBottom - 37 - 6 - 1 };
export const photoGap = 8;

export const checklistStyles = StyleSheet.create({
    nonShrinkingBlock: { flexShrink: 0 },
    section: { marginTop: 6, borderWidth: sectionBorderWidth, borderColor: tableBorderColor, flexShrink: 0 },
    sectionBody: { flexShrink: 0 },
    sectionTitle: {
        fontFamily: "Amasis",
        fontWeight: 700,
        fontSize: 9,
        textAlign: "center",
        padding: 3,
        backgroundColor: tableHeaderColor,
        borderBottomWidth: 0.75,
        borderColor: tableBorderColor,
        flexShrink: 0,
    },
    comment: { fontFamily: "Roboto", fontSize: 8.5, lineHeight: 1.45, padding: sectionPadding, flexShrink: 0 },
    labelChecks: { flexDirection: "row", borderBottomWidth: sectionBorderWidth, borderColor: tableBorderColor, flexShrink: 0 },
    labelColumn: { width: "50%", padding: 5 },
    labelPositions: { borderLeftWidth: 0.75, borderColor: tableBorderColor },
    labelText: { fontFamily: "Roboto", fontSize: 8.5, lineHeight: 1.45 },
    photoRows: { gap: photoGap, padding: sectionPadding, flexShrink: 0 },
    photoRow: { flexDirection: "row", alignItems: "flex-start", gap: photoGap, flexShrink: 0 },
    photo: { objectFit: "contain", flexShrink: 0 },
    additionalPhotos: { marginTop: 6, alignItems: "flex-start", gap: 6, flexShrink: 0 },
    additionalPhoto: { objectFit: "contain", flexShrink: 0 },
    additionalPhotoFrame: { flexShrink: 0 },
});
