export type NotificationFormatting = "bold" | "italic" | "underline" | "unorderedList" | "listItem";

export type NotificationBodyNode = { type: "text"; text: string } | { type: NotificationFormatting; children: NotificationBodyNode[] };

export const notificationBodyMarkers: Record<NotificationFormatting, { open: string; close: string }> = {
    bold: { open: "__b__", close: "__b__" },
    italic: { open: "__i__", close: "__i__" },
    underline: { open: "__u__", close: "__u__" },
    unorderedList: { open: "__ul__", close: "__/ul__" },
    listItem: { open: "__li__", close: "__/li__" },
};

export const parseNotificationBody = (body: string): NotificationBodyNode[] => {
    type Frame = {
        type: NotificationFormatting | null;
        open: string;
        close: string;
        children: NotificationBodyNode[];
    };

    const root: Frame = { type: null, open: "", close: "", children: [] };
    const stack = [root];
    const openingMarkers = new Map(Object.entries(notificationBodyMarkers).map(([type, markers]) => [markers.open, type as NotificationFormatting]));
    const markerPattern = /__(?:b|i|u|ul|li|\/ul|\/li)__/g;
    let current = root;
    let offset = 0;

    const unwrapLastFrame = () => {
        const unfinished = stack.pop();
        current = stack.at(-1) ?? root;
        if (unfinished) current.children.push({ type: "text", text: unfinished.open }, ...unfinished.children);
    };

    for (const match of body.matchAll(markerPattern)) {
        if (match.index > offset) current.children.push({ type: "text", text: body.slice(offset, match.index) });

        const marker = match[0];
        const type = openingMarkers.get(marker);
        const closingIndex = stack.map((frame) => frame.close).lastIndexOf(marker);

        if (closingIndex > 0) {
            while (stack.length > closingIndex + 1) unwrapLastFrame();

            const completed = stack.pop();
            current = stack.at(-1) ?? root;
            if (completed?.type) current.children.push({ type: completed.type, children: completed.children });
        } else if (type) {
            current = { type, ...notificationBodyMarkers[type], children: [] };
            stack.push(current);
        } else {
            current.children.push({ type: "text", text: marker });
        }

        offset = match.index + marker.length;
    }

    if (offset < body.length) current.children.push({ type: "text", text: body.slice(offset) });

    while (stack.length > 1) unwrapLastFrame();

    return root.children;
};
