import type { ReactNode } from "react";
import { parseNotificationBody, type NotificationBodyNode } from "./notificationBody";

const renderNotificationNodes = (nodes: NotificationBodyNode[]): ReactNode[] => nodes.map((node, index) => {
    if (node.type === "text") return node.text;

    const children = renderNotificationNodes(node.children);
    switch (node.type) {
        case "bold": return <strong key={index} className="font-bold">{children}</strong>;
        case "italic": return <em key={index} className="italic">{children}</em>;
        case "underline": return <u key={index} className="underline">{children}</u>;
        case "unorderedList": return <ul key={index} className="my-1 list-disc pl-5">{children}</ul>;
        case "listItem": return <li key={index}>{children}</li>;
    }
});

export const formatNotificationBody = (body: string) => renderNotificationNodes(parseNotificationBody(body));
