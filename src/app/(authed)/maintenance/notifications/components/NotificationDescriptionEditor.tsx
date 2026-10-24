"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import {
    getNotificationSelectionFormats,
    normalizeNotificationSelection,
    serializeNotificationDescription,
    setNotificationDescription,
    type NotificationEditingCommand,
    type NotificationSelectionFormats,
} from "./notificationDescription";

const editingTools: { command: NotificationEditingCommand; label: string; text: string; shortcut: string; className: string }[] = [
    { command: "bold", label: "Bold", text: "B", shortcut: "Ctrl+B", className: "size-9 font-bold" },
    { command: "italic", label: "Italic", text: "I", shortcut: "Ctrl+I", className: "size-9 italic" },
    { command: "underline", label: "Underline", text: "U", shortcut: "Ctrl+U", className: "size-9 underline" },
    { command: "insertUnorderedList", label: "Bullet list", text: "• List", shortcut: "Ctrl+Shift+8", className: "h-9 px-3 text-sm" },
];

type NotificationDescriptionEditorProps = {
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    inputRef: (element: HTMLDivElement | null) => void;
    disabled?: boolean;
    error?: boolean;
};

const NotificationDescriptionEditor = (props: NotificationDescriptionEditorProps) => {
    const { value, onChange, onBlur, inputRef, disabled, error } = props;

    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRef = useRef<Range | null>(null);
    const [activeFormats, setActiveFormats] = useState<NotificationSelectionFormats>({ bold: false, italic: false, underline: false, insertUnorderedList: false });

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || serializeNotificationDescription(editor) === value) return;

        setNotificationDescription(editor, value);
        selectionRef.current = null;
    }, [value]);

    useEffect(() => {
        const updateSelection = () => {
            const selection = window.getSelection();
            if (!selection?.rangeCount) return;

            const range = selection.getRangeAt(0);
            const editor = editorRef.current;
            if (!editor?.contains(range.commonAncestorContainer)) return;

            selectionRef.current = range.cloneRange();
            setActiveFormats(getNotificationSelectionFormats(editor, range));
        };

        document.addEventListener("selectionchange", updateSelection);
        return () => document.removeEventListener("selectionchange", updateSelection);
    }, []);

    const handleInput = () => {
        const editor = editorRef.current;
        if (!editor) return;

        onChange(serializeNotificationDescription(editor));

        const selection = window.getSelection();
        if (selection?.rangeCount) setActiveFormats(getNotificationSelectionFormats(editor, selection.getRangeAt(0)));
    };

    const toggleFormat = (command: NotificationEditingCommand) => {
        const editor = editorRef.current;
        if (!editor || disabled) return;

        editor.focus();

        const selection = window.getSelection();
        if (selection && selectionRef.current) {
            selection.removeAllRanges();
            selection.addRange(normalizeNotificationSelection(editor, selectionRef.current));
        }

        document.execCommand(command);
        handleInput();
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
        handleInput();
    };

    return (
        <div className="mb-1 flex flex-col gap-1">
            <div role="group" aria-label="Description formatting" className="flex gap-1">
                {editingTools.map((tool) => (
                    <button
                        key={tool.command}
                        type="button"
                        aria-label={tool.label}
                        aria-controls="description"
                        aria-pressed={activeFormats[tool.command]}
                        title={`${tool.label} (${tool.shortcut})`}
                        disabled={disabled}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => toggleFormat(tool.command)}
                        className={`cursor-pointer rounded border border-gray-accent text-lg focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${tool.className} ${activeFormats[tool.command] ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                    >
                        {tool.text}
                    </button>
                ))}
            </div>
            <div className="relative">
                {!value && !activeFormats.insertUnorderedList && (
                    <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-2.5 text-gray-400">
                        Enter the notification description
                    </span>
                )}
                <div
                    ref={(element) => {
                        editorRef.current = element;
                        inputRef(element);
                    }}
                    id="description"
                    role="textbox"
                    aria-label="Description"
                    aria-multiline="true"
                    aria-required="true"
                    aria-invalid={!!error}
                    aria-disabled={disabled}
                    aria-describedby="description-help description-error"
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    tabIndex={disabled ? -1 : 0}
                    onInput={handleInput}
                    onBlur={onBlur}
                    onPaste={handlePaste}
                    onKeyDown={(event) => {
                        if (!event.ctrlKey && !event.metaKey) return;

                        const key = event.key.toLowerCase();
                        const command = event.shiftKey && event.code === "Digit8" ? "insertUnorderedList" : editingTools.find((tool) => tool.text.toLowerCase() === key)?.command;
                        if (command) {
                            event.preventDefault();
                            toggleFormat(command);
                        }
                    }}
                    className={`emboss-inner min-h-36 w-full resize-y overflow-auto whitespace-pre-wrap break-words rounded-lg border-2 px-3 py-2 font-normal focus:outline-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${error ? "border-red-accent" : "border-transparent"}`}
                />
            </div>
        </div>
    );
};

export default NotificationDescriptionEditor;
