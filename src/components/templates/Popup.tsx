'use client';

import React from 'react';
import { Button, Heading, Loader, Portal } from '~/components'

type PopupProps = {
    open: boolean,
    onClose: () => void,
    heading: string,
    description?: string,
    actionLabel?: string,
    action?: () => void,
    negativeAction?: boolean,
    loading?: boolean,
}

// Popup component to display modal dialogs with optional actions
const Popup = (props: PopupProps) => {
    const { open, onClose, heading, description, actionLabel, action, negativeAction, loading } = props;
    if(!open) return;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();

        onClose();
    }

    return (
        <Portal>
            <div className="fixed z-50 top-0 left-0 h-dvh w-dvw backdrop-blur-md bg-gray-light/15" onClick={(e) => handleClick(e)}>
                <div className="flex justify-center items-center w-full h-full">
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className=" bg-background emboss p-4 rounded-lg min-w-[650px]" onClick={(e) => e.stopPropagation()}>
                            <Heading as="h2" className="border-b-2 border-gray-light w-full">{heading}</Heading>
                            <p className="mt-4">{description}</p>
                            {actionLabel && (
                                <div className="flex flex-row w-full justify-end mt-2">
                                    <div className="w-full max-w-3xs">
                                        <Button variant={negativeAction ? "delete" : "primary"} label={actionLabel} onClick={action}/>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    )
}

export default React.memo(Popup) as typeof Popup;