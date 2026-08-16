export type BaseField<ValueKeys extends string> = {
  name: ValueKeys;
  label: string;
  placeholder?: string;
  optional?: boolean;
  options?: { label: string; value: number | string | boolean }[];
  type?: string;
  checked?: boolean;
  disabled?: boolean;
  minDate?: number;
};
