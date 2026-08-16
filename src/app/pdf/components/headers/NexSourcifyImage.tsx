import { Image, View } from "@react-pdf/renderer";
import React from "react";
import { nexSourcifyImage } from "~/assets";

const NexSourcifyLogo = () => {
	return (
		<View style={{ width: "100%", alignItems: "flex-end" }} fixed>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<Image style={{ width: "80px", height: "27px", textAlign: "right", marginBottom: 10 }}
				src={nexSourcifyImage.src}
			/>
		</View>
	);
};

export default React.memo(NexSourcifyLogo);
