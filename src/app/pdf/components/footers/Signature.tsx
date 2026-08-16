import { Text, View } from '@react-pdf/renderer';
import React from 'react';
import { styles } from '../pdfConfig';

const Signature = ({signatures}: { signatures: string[] }) => {
	return (
		<View style={styles.signature} wrap={false}>
			{signatures.map((signature, index) => (
				<Text
					key={index} 
					style={styles.signatureText}
				>
					{signature}
				</Text>
			))}
		</View>
	);
};

export default React.memo(Signature);
