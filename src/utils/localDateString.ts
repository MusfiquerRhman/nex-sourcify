export type DateInput = Date | string | number;

export interface LocalDateTimeFormatOptions extends Intl.DateTimeFormatOptions {
    day: '2-digit';
    month: 'short';
    year: 'numeric';
    hour: '2-digit';
    minute: '2-digit';
    second: '2-digit';
    hour12: true;
}

export const formatDateTime = (dateInput: DateInput): string => {
    const date: Date = new Date(dateInput);

    const options: LocalDateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };

    // 'en-GB' gives day–month–year order and 12-hour clock when hour12: true
    return date.toLocaleString('en-GB', options).replace(',', '');
};

export const formatDate = (dateInput: DateInput): string => {
    const date: Date = new Date(dateInput);
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    };
    return date.toLocaleDateString('en-GB', options);
};

export const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});