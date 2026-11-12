import { XIcon } from "lucide-react";

interface PlatfromPickerModalProps {
  connectedIds: string[];
  connecting: string | null;
  onClose: () => void;
  onConnect: (platformId: string) => Promise<void>;
}



const PlatfromPickerModal = ({ connectedIds, connecting, onClose, onConnect }: PlatfromPickerModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40
    backdrop-blur-xl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shadow">
          <h3 className="text-slate-700">Choose a Platfrom</h3>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <XIcon className="size-4"/>
          </button>
        </div>

        {/* Platform List */}



      </div>
    </div>
  )
}

export default PlatfromPickerModal