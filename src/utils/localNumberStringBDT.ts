import { ones, tens } from "./localNumberStrings";

export const currencyFormatterBDT = (value: number, currencySymbol: string) => {
    return `${currencySymbol} ${(value ?? 0).toLocaleString('EN-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const units = ["", "Thousand", "Lakh", "Crore"];

const convertHundreds = (num: number): string => {
    let str = "";

    if (num >= 100) {
        str += `${ones[Math.floor(num / 100)]} Hundred `;
        num %= 100;
    }

    if (num >= 20) {
        str += `${tens[Math.floor(num / 10)]} `;
        num %= 10;
    }

    if (num > 0) {
        str += `${ones[num]} `;
    }

    return str.trim();
};

const convertTwoDigits = (num: number): string => {
    if (num < 20) return ones[num]!;

    return `${tens[Math.floor(num / 10)]}${num % 10 ? " " + ones[num % 10] : ""}`;
};

const numberToWordsBDT = (num: number): string => {
    if (num === 0) return "Zero";

    const parts: string[] = [];

    // Last 3 digits
    const hundreds = num % 1000;

    if (hundreds) {
        parts.unshift(convertHundreds(hundreds));
    }

    num = Math.floor(num / 1000);

    let unitIndex = 1;

    while (num > 0) {
        const group = num % 100;

        if (group) {
            if (unitIndex <= 3) {
                parts.unshift(`${convertTwoDigits(group)} ${units[unitIndex]}`.trim());
            } 
            else {
                const croreLevel = unitIndex - 3;

                const prefixes = ["", "Hundred", "Thousand", "Lakh"];

                const prefix = croreLevel < prefixes.length
                    ? prefixes[croreLevel]
                    : `${numberToWordsBDT(Math.pow(100, croreLevel - 1))} Crore`;

                parts.unshift(`${convertTwoDigits(group)} ${prefix} Crore`.replace(/\s+/g, " ").trim());
            }
        }

        num = Math.floor(num / 100);
        unitIndex++;
    }

    return parts.join(" ").replace(/\s+/g, " ").trim();
};

export const amountToWordsBDT = (amount: number): string => {
    const rounded = Math.round(amount * 100);

    const taka = Math.floor(rounded / 100);
    const paisa = rounded % 100;

    let result = `${numberToWordsBDT(taka)} Taka`;

    if (paisa > 0) {
        result += ` and ${numberToWordsBDT(paisa)} Paisa`;
    }

    return `${result} Only.`;
};