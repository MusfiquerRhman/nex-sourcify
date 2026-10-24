import { notificationBodyMarkers, parseNotificationBody, type NotificationBodyNode, type NotificationFormatting } from "~/utils/notificationBody";

export type NotificationEditingCommand = "bold" | "italic" | "underline" | "insertUnorderedList";
export type NotificationSelectionFormats = Record<NotificationEditingCommand, boolean>;

type InlineFormats = Pick<NotificationSelectionFormats, "bold" | "italic" | "underline">;
type TextRun = InlineFormats & { text: string };

const inlineFormats = ["bold", "italic", "underline"] as const;
const emptyFormats: InlineFormats = { bold: false, italic: false, underline: false };

const wrapFormatting = (text: string, format: NotificationFormatting) => {
    const { open, close } = notificationBodyMarkers[format];
    return `${open}${text}${close}`;
};

const getElementFormats = (element: HTMLElement, inherited: InlineFormats): InlineFormats => {
    const { fontWeight, fontStyle, textDecoration, textDecorationLine } = element.style;

    return {
        bold: fontWeight ? fontWeight === "bold" || Number(fontWeight) >= 600 : inherited.bold || ["B", "STRONG"].includes(element.tagName),
        italic: fontStyle ? ["italic", "oblique"].includes(fontStyle) : inherited.italic || ["I", "EM"].includes(element.tagName),
        underline: inherited.underline || element.tagName === "U" || (textDecorationLine || textDecoration).includes("underline"),
    };
};

export const serializeNotificationDescription = (editor: HTMLElement): string => {
    if (!editor.textContent?.trim()) return "";

    const serializeChildren = (parent: HTMLElement, inherited: InlineFormats): string => {
        const runs: TextRun[] = [];
        let output = "";
        let previousWasBlock = false;

        const appendText = (text: string, formats: InlineFormats) => {
            if (!text) return;

            const previousRun = runs.at(-1);
            if (previousRun && inlineFormats.every((format) => previousRun[format] === formats[format])) previousRun.text += text;
            else runs.push({ text, ...formats });
        };

        const flushRuns = () => {
            output += runs.map((run) => inlineFormats.reduceRight((text, format) => run[format] ? wrapFormatting(text, format) : text, run.text)).join("");
            runs.length = 0;
        };

        Array.from(parent.childNodes).forEach((node, index) => {
            const isBlock = node instanceof HTMLElement && ["DIV", "P", "UL", "OL", "LI"].includes(node.tagName);
            const hasExplicitNewline = (node.previousSibling?.textContent?.endsWith("\n") ?? false) || (!isBlock && (node.textContent?.startsWith("\n") ?? false));
            if (index > 0 && (isBlock || previousWasBlock) && !hasExplicitNewline) appendText("\n", inherited);
            previousWasBlock = isBlock;

            if (node.nodeType === Node.TEXT_NODE) {
                appendText(node.textContent?.replace(/\u00a0/g, " ") ?? "", inherited);
                return;
            }

            if (!(node instanceof HTMLElement)) return;
            if (node.tagName === "BR") {
                if (node.nextSibling) appendText("\n", inherited);
                return;
            }

            const formats = getElementFormats(node, inherited);
            if (node.tagName === "UL" || node.tagName === "OL") {
                flushRuns();
                const items = Array.from(node.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === "LI");
                output += wrapFormatting(items.map((item) => wrapFormatting(serializeChildren(item, getElementFormats(item, formats)), "listItem")).join(""), "unorderedList");
                return;
            }

            const nested = serializeChildren(node, formats);
            if (nested) {
                flushRuns();
                output += nested;
            }
        });

        flushRuns();
        return output;
    };

    return serializeChildren(editor, emptyFormats);
};

export const setNotificationDescription = (editor: HTMLElement, value: string) => {
    const tags = { bold: "strong", italic: "em", underline: "u", unorderedList: "ul", listItem: "li" };
    const createNode = (node: NotificationBodyNode): Node => {
        if (node.type === "text") return document.createTextNode(node.text);

        const element = document.createElement(tags[node.type]);
        element.append(...node.children.map(createNode));
        return element;
    };

    editor.replaceChildren(...parseNotificationBody(value).map(createNode));
};

const getSelectedText = (editor: HTMLElement, range: Range) => {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const selected: { node: Node; start: number; end: number }[] = [];
    let node = walker.nextNode();

    while (node) {
        if (range.intersectsNode(node)) {
            const text = node.textContent ?? "";
            const start = node === range.startContainer ? range.startOffset : 0;
            const end = node === range.endContainer ? range.endOffset : text.length;
            if (text.slice(start, end).trim()) selected.push({ node, start, end });
        }

        node = walker.nextNode();
    }

    return selected;
};

export const normalizeNotificationSelection = (editor: HTMLElement, range: Range) => {
    if (range.collapsed) return range;

    const selected = getSelectedText(editor, range);
    const first = selected[0];
    const last = selected.at(-1);
    if (!first || !last) return range;

    const normalized = range.cloneRange();
    normalized.setStart(first.node, first.start);
    normalized.setEnd(last.node, last.end);
    return normalized;
};

export const getNotificationSelectionFormats = (editor: HTMLElement, range: Range): NotificationSelectionFormats => {
    const formats: NotificationSelectionFormats = {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
    };
    if (range.collapsed) return formats;

    const selected = getSelectedText(editor, range);
    if (!selected.length) return formats;

    return {
        bold: selected.every(({ node }) => Number(window.getComputedStyle(node.parentElement ?? editor).fontWeight) >= 600),
        italic: selected.every(({ node }) => ["italic", "oblique"].includes(window.getComputedStyle(node.parentElement ?? editor).fontStyle)),
        underline: selected.every(({ node }) => {
            let element = node.parentElement;
            while (element && editor.contains(element)) {
                if (window.getComputedStyle(element).textDecorationLine.includes("underline")) return true;
                element = element.parentElement;
            }
            return false;
        }),
        insertUnorderedList: selected.every(({ node }) => !!node.parentElement?.closest("ul") && editor.contains(node.parentElement.closest("ul"))),
    };
};
