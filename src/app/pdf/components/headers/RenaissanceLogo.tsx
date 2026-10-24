import { Image, View } from "@react-pdf/renderer";
import React from "react";


const RenaissanceLogo = () => {
	return (
		<View style={{ width: "100%", alignItems: "flex-end", height: 44, overflow: "hidden", marginBottom: 10 }} fixed>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<Image style={{ width: 150, height: 150, objectFit: "contain", marginTop: -54 }}
				src="/nexsourcify-logo.png"
			/>
		</View>
	);
};

export default React.memo(RenaissanceLogo);
