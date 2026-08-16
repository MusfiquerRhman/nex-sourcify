'use client';

import Image from "next/image";
import React, { useState } from "react";
import { viewIcon, hideIcon } from "~/assets";

const ShowPassword = ({ password }: { password: string }) => {
	const [isVisible, setIsVisible] = useState<boolean>(false);

	return (
		<div className="flex flex-row">
			<input
				type={isVisible ? "text" : "password"}
				value={password}
				readOnly
				className="m-0 w-full border-0 bg-transparent p-0 text-center focus:outline-none border-none"
			/>
			<button className="w-6" onClick={() => setIsVisible(!isVisible)}>
				{isVisible ? <Image width={20} height={20} src={hideIcon.src} alt="Hide" /> : <Image width={20} height={20} src={viewIcon.src} alt="Show" />}
			</button>
		</div>
	);
};

export default React.memo(ShowPassword) as typeof ShowPassword;