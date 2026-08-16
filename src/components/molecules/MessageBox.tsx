/**
 * MessageBox component to display messages with different variants (primary, secondary, warning, error, info).
 * 
 * Props:
 * - message: The message to display in the box.
 * - active: A boolean to control the visibility of the message box.
 * - type: The variant type of the message box which determines its styling.
 * 
 * Primary: pending for Approval.
 * Secondary: Authorization Completed.
 * Error: Errors
 * Warning: Blocked actions due to authorizations or approvals of other process.
 * Info: Informational messages.
 */

import clsx from "clsx";
import Info from "../atoms/Info";
import React from "react";

interface MessageBoxProps {
    message: string;
    active: boolean;
    type: "primary" | "secondary" | "warning" | "error" | "info";
}

const MessageBox = ({ message, active, type }: MessageBoxProps) => {
    const variantClasses: string = ({
        primary: "border-primary text-primary bg-primary/5",
        secondary: "border-secondary text-secondary bg-secondary/5",
        warning: "border-orange-600 text-orange-600 bg-orange-600/5",
        error: "border-red text-red bg-red/5",
        info: "border-gray text-gray bg-gray/5",
    } as Record<NonNullable<MessageBoxProps['type']>, string>)[type];

    return (
        active ? (
            <Info className={clsx(variantClasses, 'mx-8 rounded-lg px-4 py-2 border border-dashed my-2 w-3xl')}
                info= {message} 
            />
        ) : null
    )
}

export default React.memo(MessageBox);