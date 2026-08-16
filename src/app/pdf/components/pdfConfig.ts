import { StyleSheet } from "@react-pdf/renderer";

export const tableBorderColor = "#ADADAD";
export const tableHeaderColor = "#C0F0F7";
export const secondaryTableHeaderColor = "#FFFF99";

import { Font } from "@react-pdf/renderer";

export const registerPdfFonts = () => {
    Font.register({
        family: "Amasis",
        fonts: [
            { src: "/fonts/Amasis_MT_Std.ttf", fontWeight: 400 },
            { src: "/fonts/Amasis_MT_Std_Bold.ttf", fontWeight: 700 },
        ],
    });

    Font.register({
        family: "poppins",
        fonts: [
            { src: "/fonts/Poppins-Regular.ttf", fontWeight: 400 },
            { src: "/fonts/Poppins-SemiBold.ttf", fontWeight: 500 },
            { src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 },
        ],
    });

    Font.register({
        family: "Roboto",
        fonts: [
            { src: "/fonts/Roboto.ttf", fontWeight: 400 },
            { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700 },
        ],
    });
};

export const styles = StyleSheet.create({
    body: {
        paddingTop: 20,
        paddingBottom: 50,
        fontFamily: "poppins",
        minWidth: "100vw",
        letterSpacing: 0.15,
        paddingHorizontal: 20,
        position: 'relative',
    },
    pageNumber: {
        position: "absolute",
        fontSize: 8,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "grey",
    },
    tableContainer: {
        width: "100%",
    },
    headerRow: {
        borderTopWidth: 1.5,
        borderTopColor: tableBorderColor,
        borderLeftWidth: 1.5,
        borderLeftColor: tableBorderColor,
        flexDirection: "row",
        backgroundColor: tableHeaderColor,
    },
    headerCell: {
        padding: 5,
        fontSize: 9,
        fontFamily: "Amasis",
        borderRightWidth: 1.5,
        borderRightColor: tableBorderColor,
        borderBottomWidth: 1.5,
        borderBottomColor: tableBorderColor,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        width: "100%",
        borderLeftWidth: 0.75,
        borderLeftColor: tableBorderColor,
        borderBottomWidth: 0.75,
        borderBottomColor: tableBorderColor,
    },
    cell: {
        padding: "3px",
        fontSize: "8px",
        height: "auto",
        borderRightWidth: 0.75,
        fontFamily: 'Roboto',
        borderRightColor: tableBorderColor,
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
    },
    signature: {
        marginTop: 70,
        width: "100%",
        display: "flex",
        flexDirection: "row",
        fontSize: 9,
        gap: 15,
        fontFamily: "poppins",
        justifyContent: "space-around",
    },
    signatureText: {
        borderTopWidth: 0.75,
        borderTopColor: tableBorderColor,
        padding: "5px 15px",
        textAlign: "center",
    },
    doubleColumnContainer: {
        display: "flex",
        flexDirection: "row",
        gap: 20,
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 5,
    },
    textAmasis: {
        fontSize: 9,
        fontFamily: "Amasis",
    },
    textBold: {
        fontSize: 9,
        fontFamily: "Amasis",
        fontWeight: "bold",
    },
    text: {
        fontSize: 9,
        fontFamily: "poppins",
    },
    flex_r_5: {
        display: 'flex', 
        flexDirection: 'row', 
        marginBottom: 5,
        alignItems: 'flex-start',
    },
    pageBackground: {
        position: 'absolute',
        zIndex: -1000,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "90%",
        marginTop: "10px",
    },
    salesContractOrderRefs: {
        fontSize: 9,
        fontWeight: "bold",
        fontFamily: "poppins",
        padding: 6,
    },
    subtitle: {
        fontSize: 9,
        fontFamily: "Amasis",
        textAlign: "center",
        marginBottom: 10,
        maxWidth: "55%",
    },
    doubleColumn: {
        display: "flex", 
        flexDirection: "row", 
        justifyContent: "space-between",
        marginBottom: 10,
        marginTop: 15,
        gap: 10,
    },
    textField: {
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center'
    },
    textBorder: {
        borderColor: tableBorderColor,
		borderWidth: 0.5,
        padding: 2, 
        width: 170, 
        textAlign: "center"
    },
    flex_c_5: {
        display: 'flex', 
        flexDirection: 'column', 
        marginBottom: 5,
    },
    border: {
        borderColor: tableBorderColor,
		borderWidth: 0.5,
        padding: 4,
        marginTop: 2,
    },
    BorderTableText: {
        borderColor: tableBorderColor,
		borderLeftWidth: 0.5,
		borderBottomWidth: 0.5,
        padding: 3
    },
    BorderTable: {
        borderColor: tableBorderColor,
		borderRightWidth: 0.5,
		borderTopWidth: 0.5,
    }
});
