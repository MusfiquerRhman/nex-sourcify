import "~/styles/globals.css";

import { type Metadata } from "next";
import { Poppins, Rajdhani, Lato } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from 'sonner';
import { headers } from "next/headers";

export const metadata: Metadata = {
	title: "Nex Sourcify",
	description: "Nex-sourcify Application",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const poppins = Poppins({
	subsets: ["latin"],
	variable: "--font-poppins",
	weight: ["400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
	subsets: ["latin"],
	variable: "--font-rajdhani",
	weight: ["400", "500", "600", "700"],
});

const lato = Lato({
	subsets: ['latin'],
	variable: '--font-lato',
	weight: ["400", "700"],
})

export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  	const nonce = (await headers()).get("x-nonce") ?? undefined;

	return (
		<html lang="en" className={`${poppins.variable} ${rajdhani.variable} ${lato.variable}`}>
			<head>
				<meta property="csp-nonce" content={nonce} />
			</head>
			<body>
				<div>
					<TRPCReactProvider>
						{children}
						<div id='portal-root' /> {/* Global portal root */}
						<Toaster position="top-right" />
					</TRPCReactProvider>
				</div>
			</body>
		</html>
	);
}
