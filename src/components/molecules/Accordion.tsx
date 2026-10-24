'use client';

import { useEffect, type JSX } from "react";
import Button from "../atoms/Button";
import { motion } from "framer-motion";

import { caretDownIcon, caretUpIcon } from "~/assets";
import { useSidebarStore } from "~/store/useSidebarStore";

import type { StaticImageData } from "next/image";

type AccordionProps = {
    id: number;
    items: JSX.Element[];
    label: string;
    icon?: StaticImageData;
    isLinkOpen?: boolean;
};

// Accordion component with expandable/collapsible functionality
const Accordion = ({id, items, label, icon, isLinkOpen}: AccordionProps) => {
    const storedIsOpen = useSidebarStore((state) => state.accordionStates[id]);
    const setAccordionState = useSidebarStore((state) => state.setAccordionState);
    const toggleAccordionState = useSidebarStore((state) => state.toggleAccordionState);

    const isOpen = storedIsOpen ?? Boolean(isLinkOpen);

    useEffect(() => {
        if (isLinkOpen) {
          	setAccordionState(id, true);
        }
    }, [id, isLinkOpen, setAccordionState]);

    return (
		<div className="nex-nav-group" data-open={isOpen} data-active={Boolean(isLinkOpen)}>
			<Button onClick={() => toggleAccordionState(id)} 
				aria-expanded={isOpen}
				aria-controls={`accordion-panel-${id}`}
				variant="accordion"
				type="button" 
				label={label} 
				rightIcon={isOpen ? caretUpIcon : caretDownIcon} 
				className={`nex-sidebar-link nex-nav-group-toggle ${isOpen ? 'bg-secondary text-[0.9rem]' : 'bg-transparent text-[0.9rem]'}`}
				leftIcon={icon} 
			/>
			<motion.div
				id={`accordion-panel-${id}`}
				aria-hidden={!isOpen}
				inert={!isOpen}
				initial={{ height: 0, opacity: 0 }}
				animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
				className="nex-nav-group-panel overflow-hidden bg-gray-light/10 border-gray-accent ml-2 border-l-4 rounded-bl-md z-50"
			>
				{items.map((item, index) => (
					<div key={index}>{item}</div>
				))}
			</motion.div>
		</div>
    );
};

export default Accordion;
