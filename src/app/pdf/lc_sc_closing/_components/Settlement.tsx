import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { tableBorderColor } from "../../components/pdfConfig";
import { checkMarkIcon } from "~/assets";

const SettlementType = ({isPartial}: { isPartial: boolean }) => {
    return (
        <View style={styles.container}>
            <Text>Settlement:{' '}</Text>
            <View style={styles.checkBoxContainer}>
                <Text style={styles.checkBoxText}> Full </Text>
                <View style={styles.checkBox}>
                    {!isPartial 
                        ? <Image style={{ height: 10, width: 10 }} src={checkMarkIcon.src} 
                    /> : ''}
                </View>
            </View>
            <View style={styles.checkBoxContainer}>
                <Text style={styles.checkBoxText}> Partial </Text>
                <View style={styles.checkBox}>
                    {isPartial 
                        ? <Image style={{ height: 10, width: 10 }} src={checkMarkIcon.src} 
                    /> : ''}
                </View>
            </View>
        </View>
    )
}

export default SettlementType;

const styles = StyleSheet.create({
    container: {
        fontSize: 9,
        display: "flex",
        flexDirection: "row",
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkBoxContainer: {
        display: "flex",
        alignItems: 'center',
        flexDirection: "row",
    },
    checkBox: {
        width: 40,
        height: 20,
        border: `1px solid ${tableBorderColor}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBoxText: {
        paddingRight: 5,
        paddingLeft: 20,                
    }
});