import React from "react";

import { Text, View } from "@react-pdf/renderer";
import { formatDate } from "~/utils/localDateString";
import { useDecodedUser } from "~/hooks";

const PrintByAndDate = () => {
	const today = formatDate(new Date());
	const {user} = useDecodedUser();

	return (
		<View style={{ flexDirection: "row", justifyContent: "flex-end", }}>
			<View style={{ width: "100%", textAlign: "right", marginTop: "10px" }}>
				<Text style={{ fontSize: 9, fontFamily: "Amasis", marginBottom: 4 }}>
					Print Date: {today}
				</Text>
				<Text style={{ fontSize: 9, fontFamily: "Amasis" }}>
					Printed By: {user?.first_name + ` ` + user?.last_name}
				</Text>
			</View>
		</View>
	);
};

export default React.memo(PrintByAndDate);
