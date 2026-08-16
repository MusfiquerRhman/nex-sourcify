export const toInputName = (label: string) =>
    label
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "_"); // replace spaces with underscores