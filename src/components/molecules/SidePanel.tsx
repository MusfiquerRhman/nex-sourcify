"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import useDialogFocus from "~/hooks/useDialogFocus";
import Portal from "./portal";

type SidePanelProps = {
	open: boolean;
	id: string;
	labelledBy: string;
	closeLabel: string;
	onClose: () => void;
	children: ReactNode;
};

function SidePanelContent(props: Omit<SidePanelProps, "open">) {
	const { id, labelledBy, closeLabel, onClose, children } = props;

	const panelRef = useDialogFocus(onClose);
	const reducedMotion = useReducedMotion();
	const transition = {
		type: "tween",
		duration: reducedMotion ? 0 : 0.15,
		ease: "linear",
	} as const;

	return (
		<div className="fixed inset-0 z-[60] rounded-md">
			<motion.button
				type="button"
				tabIndex={-1}
				aria-label={closeLabel}
				onClick={onClose}
				initial={reducedMotion ? false : { opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={transition}
				className="absolute inset-0 cursor-default bg-slate-950/25"
			/>
			<motion.aside
				ref={panelRef}
				id={id}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledBy}
				tabIndex={-1}
				initial={reducedMotion ? false : { x: "100%" }}
				animate={{ x: 0 }}
				exit={{ x: "100%" }}
				transition={transition}
				className="absolute inset-y-0 right-0 flex h-[99dvh] w-full max-w-[450px] flex-col bg-gray-50 shadow-2xl outline-none 
				 	m-1 rounded-lg overflow-hidden"
			>
				{children}
			</motion.aside>
		</div>
	);
}

export default function SidePanel({ open, ...props }: SidePanelProps) {
	return (
		<Portal>
			<AnimatePresence>
				{open && <SidePanelContent key={props.id} {...props} />}
			</AnimatePresence>
		</Portal>
	);
}
