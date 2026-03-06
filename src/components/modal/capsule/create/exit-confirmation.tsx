import { ModalCloseBtn } from "../../modalLayout";
import { useModal } from "@/hooks/use-modal";

interface ExitConfirmationProps {
    data?: {
        onConfirm?: () => void;
        onClose?: () => void;
    };
}

export function ExitConfirmation({ data }: ExitConfirmationProps) {
    const { close } = useModal();

    const handleClose = () => {
        if (data?.onClose) data.onClose();
        close("exit-confirmation");
    };

    const handleConfirm = () => {
        if (data?.onConfirm) data.onConfirm();
        close("exit-confirmation");
    };

    return (
        <div className="modal-container w-full max-w-full sm:!max-w-96 md:!max-w-120 p-4 sm:p-6 bg-white rounded-2xl shadow-xl relative z-50">
            <ModalCloseBtn onClick={handleClose} />
            <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-5 text-center sm:text-left">
                <div className="space-y-3 sm:space-y-4">
                    <h4 className="modal-title text-lg sm:text-xl text-gray-900 font-semibold">
                        Unsaved Changes
                    </h4>
                    <span className="text-gray-500 text-sm block">
                        You have unsaved changes. Are you sure you want to cancel and lose
                        your progress?
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-2">
                    <button
                        type="button"
                        className="w-full sm:flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-semibold text-sm shadow outline-none hover:bg-gray-50 transition-colors"
                        onClick={handleClose}
                    >
                        No, keep editing
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="w-full sm:flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-lg h-10 font-semibold text-sm outline-none transition-colors"
                    >
                        Yes, exit
                    </button>
                </div>
            </div>
        </div>
    );
}
