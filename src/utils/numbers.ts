export const safeNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};

export const dividedByZeroSafe = (numerator: number, denominator: number) => {
    return denominator === 0 ? 0 : numerator / denominator;
}