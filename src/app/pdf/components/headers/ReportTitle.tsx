import { Text, View } from "@react-pdf/renderer";
import React from "react";

const ReportTitle = ({ title }: { title: string }) => {
    return (
        <View style={{ width: "100%", textAlign: "center" }}>
            <Text
                style={{
                fontSize: "18px",
                fontFamily: "Amasis",
                fontWeight: "bold",
                marginTop: '-10px',
                }}
            >
                {title}
            </Text>
        </View>
    );
};

export default React.memo(ReportTitle);

