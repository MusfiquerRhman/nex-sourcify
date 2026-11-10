import { Image, View } from "@react-pdf/renderer";
import React from "react";

const NexSourcifyLogo = () => {
	return (
		<View style={{ width: "100%", height: 28, marginBottom: 9, overflow: "hidden" }} fixed>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<Image
				// The artwork sits in the center of a transparent square.
				style={{ position: "absolute", width: 140, height: 140, top: -53, right: -21 }}
				src="/nexsourcify-logo.png"
			/>
		</View>
	);
};

export default React.memo(NexSourcifyLogo);
