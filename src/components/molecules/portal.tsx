"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
    children: React.ReactNode;
    containerId?: string;
}

// Portal component to render children into a DOM node outside the main React tree
export default function Portal({ children, containerId = "portal-root" }: PortalProps) {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const el = document.getElementById(containerId);
        if (!el) {
            console.error(`Portal target #${containerId} not found`);
            return;
        }
        setContainer(el);
    }, [containerId]);

    // Prevent rendering until mounted and container is set
    if (!container) return null; 

    return createPortal(children, container);
}
