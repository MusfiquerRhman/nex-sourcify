import { useFieldArray, useForm } from "react-hook-form";
import type { OrderFormValues } from "../config/formSchema";
import type { useBuyerOrderForm } from "../config/useBuyerOrderForm";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import clsx from "clsx";
import React from "react";

type ColorForm = {
  color_id: string;
  quantity: number;
};

type Props = {
  onClose: () => void;
  colorOptions: {
      id: number;
      name: string;
  }[];
  methods: ReturnType<typeof useBuyerOrderForm>['methods'];
  styleIndex: number;
  selectedShipmentIndex: number;
  disabled?: boolean;
};

const ColorPopup = ({ onClose, colorOptions, methods, styleIndex, selectedShipmentIndex, disabled }: Props ) => {
      const {
          fields: colorsFields,
          append: addColors,
          remove: removeColors,
      } = useFieldArray<
          OrderFormValues,
          `order.styles.${number}.shipments.${number}.colors`
      >({
          control: methods.control,
          name: `order.styles.${styleIndex}.shipments.${selectedShipmentIndex}.colors`,
      });
  

  const { register, handleSubmit, reset } = useForm<ColorForm>({
    defaultValues: {
      color_id: "",
      quantity: 0,
    },
  });

  const submitHandler = (data: ColorForm) => {
    addColors(data); // straight into RHF field array
    reset();
  };

  const utils = api.useUtils();

  const deleteColorMutation = api.buyerOrders.deleteColor.useMutation({
    onSuccess: async () => {
      await utils.buyerOrders.getBuyerOrders.invalidate();
      toast.success("Color deleted successfully!");
    },
  });


  const removeColor = async (index: number) => {
    try {
      if(!!colorsFields[index]?.db_id) {
        await deleteColorMutation.mutateAsync({ color_id: colorsFields[index].db_id! });
      }

      removeColors(index);
    }
    catch (error) {
      const message = parseTRPCError(error);
      toast.error(`Error deleting Color: ${message}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-[420px] space-y-4">
        <h3 className="text-lg font-semibold">Colors</h3>

        {/* Existing colors */}
        {colorsFields.length === 0 ? (
          <p className="text-sm text-gray-500">No colors added yet</p>
        ) : (
          <ul className="space-y-2">
            {colorsFields.map((color, index) => (
              <li
                key={index}
                className="flex justify-between items-center border p-2 border-gray-accent rounded px-4"
              >
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="font-medium flex-1">{colorOptions.find(option => option.id === Number(color.color_id))?.name}</div>
                  <div className="text-sm text-gray-500">
                    Quantity: {color.quantity}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  disabled={disabled}
                  className={clsx("text-red-500 ml-4", disabled ? "cursor-not-allowed opacity-50" : "hover:cursor-pointer hover:text-red-700")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new color */}
        <form
          onSubmit={handleSubmit(submitHandler)}
          className="space-y-2 border-t pt-3 flex flex-col"
        >
          <select disabled={disabled} {...register("color_id", { required: true })} className="px-4 py-2 border border-gray-accent rounded-lg flex-1">
            <option value="">Select Color</option>
            {colorOptions.map(color => (
              <option key={color.id} value={color.id}>{color.name}</option>
            ))}
          </select>

          <div className="flex flex-row gap-4 items-center">
            <label htmlFor="quantity">Quantity</label>
            <input
                type="number"
                id="quantity"
                className="px-4 py-2 border border-gray-accent rounded-lg flex-1"
                placeholder="Quantity"
                disabled={disabled}
                {...register("quantity", { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-red text-white px-4 py-2 rounded-lg">
              Close
            </button>
            <button type="button" 
              onClick={handleSubmit(submitHandler)} 
              className={clsx("text-white px-4 py-2 rounded-lg", disabled ? "cursor-not-allowed bg-gray-accent" : "hover:cursor-pointer hover:bg-primary-dark bg-primary")} 
              disabled={disabled}>
              Add Color
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(ColorPopup) as typeof ColorPopup;