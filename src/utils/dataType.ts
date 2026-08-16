export const dataType = (data: unknown): string => {
    return Object.prototype.toString.call(data).slice(8, -1);
}
