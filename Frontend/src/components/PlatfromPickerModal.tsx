import { CheckCheckIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import { PLATFORMS } from "../assets/assets";

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
            <XIcon className="size-4" />
          </button>
        </div>


        {/* Platform List */}
        <div className="p-6 flex flex-col gap-3">
          {PLATFORMS.map((p) => {
            const isConnected = connectedIds.includes(p.id);
            const isConnecting = connecting === p.id;

            return (
              <button
                key={p.id}
                disabled={isConnected || isConnecting}
                onClick={() => onConnect(p.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-300 ${isConnected
                    ? "bg-red-50 border-red-100 cursor-not-allowed"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50"
                  } ${isConnecting
                    ? "bg-red-50 border-red-200 cursor-not-allowed"
                    : ""
                  }`}
              >
                {/* Logo + Platform Information */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-11 shrink-0 rounded-xl flex items-center justify-center ${isConnected ? "bg-red-100" : "bg-slate-50"
                    }`}>
                    <p.icon
                      className={`size-5 ${isConnected ? "text-red-600" : "text-slate-500"
                        }`}
                    />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      {p.name}
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {isConnected ? "Already Connected" : p.description}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {isConnected && (
                    <CheckCheckIcon className="size-4 text-red-500" />
                  )}

                  {isConnecting && (
                    <div className="size-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  )}

                  {!isConnected && !isConnecting && (
                    <ExternalLinkIcon className="size-4 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>


      </div>
    </div>
  )
}

export default PlatfromPickerModal