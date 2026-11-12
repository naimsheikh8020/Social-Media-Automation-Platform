// import { AlertCircleIcon, CheckCircleIcon, PlusIcon, UnplugIcon } from "lucide-react";
// import { PLATFORMS } from '../assets/assets';

// interface AccountListProps {
//   accounts: any[];
//   onDisconnect: () => Promise<void>;
// }

// const AccountList = ({ accounts, onDisconnect }: AccountListProps) => {
//   const handleDisconnect = async (accountId: string) => {
//     const confirm = window.confirm("Are you sure you want to disconnect this account?");
//     if (!confirm) {
//       return;
//     }
//     await onDisconnect(accountId);
//   }
//   if (accounts.length === 0) {
//     return (
//       <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-20 px-6">

//         <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
//           <PlusIcon className="size-6 text-slate-500 opacity-50 " />
//         </div>
//         <p className="text-slate-700 text-lg">No Accounts Connected</p>
//         <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Connect your first sociall platform to start scheduling and automating your content</p>

//       </div>
//     )
//   }
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//       {
//         accounts.map((account, index) => {
//           const meta = PLATFORMS.find((p) => p.id === account.platform);

//           if (!meta) return null;

//           return (
//             <div key={index} className="group bg-white border border-slate-200 rounded-2xl p-55 flex items-center gap-4 hover:border-slate-300 transition-all">
//               <div className="size-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
//                 <meta.icon className="size-6 text-slate-500" />
//               </div>
//               <div>
//                 <div className="text-slate-900 truncate">{account.handle}</div>
//                 <div className="text-slate-500 mt-0.5 text-sm">{meta.name}</div>
//               </div>
//               <div className="flex items-center gap-1.5 shrink-0">
//                 {
//                   account.status === "connected" ? (
//                   <>
//                   <CheckCircleIcon className="size-4 text-emerald-500"/>
//                   <span className="text-xs text-emerald-600">Connected</span>
//                   </>
//                   ) 
                  
//                   : 
                  
//                   (<div>
//                     <AlertCircleIcon className="size-4 text-amber-500"/>
//                     <span className="text-xs text-amber-600">Disconnected</span>
//                   </div>)
//                 }
//               </div>
//               <button 
//               onClick={()=> handleDisconnect(account._id)}
//               title="Disconnect account"
//               className="ml-2 p-1.5 rounded-lg text-slate-300 group-hover:text-red-500 transition-all">
//                 <UnplugIcon className="size-4"/>
//               </button>
//             </div>
//           );
//         })
//       }
//     </div>
//   )
// }

// export default AccountList






import {
  AlertCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  UnplugIcon,
} from "lucide-react";

import { PLATFORMS } from "../assets/assets";

interface Account {
  _id: string;
  platform: string;
  handle: string;
  status: "connected" | "disconnected";
}

interface AccountListProps {
  accounts: Account[];
  onDisconnect: (accountId: string) => Promise<void>;
}

const AccountList = ({ accounts, onDisconnect }: AccountListProps) => {
  const handleDisconnect = async (accountId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to disconnect this account?"
    );

    if (!confirmed) return;

    try {
      await onDisconnect(accountId);
    } catch (error) {
      console.error("Failed to disconnect account:", error);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center py-20 px-6">
        <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
          <PlusIcon className="size-6 text-slate-400" />
        </div>

        <p className="text-slate-700 text-lg font-medium">
          No Accounts Connected
        </p>

        <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">
          Connect your first social platform to start scheduling and automating
          your content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {accounts.map((account) => {
        const meta = PLATFORMS.find(
          (p) => p.id === account.platform
        );

        if (!meta) return null;

        const isConnected = account.status === "connected";

        return (
          <div
            key={account._id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300"
          >
            {/* Account Information */}
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                <meta.icon className="size-6 text-slate-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-semibold text-slate-800 truncate"
                  title={account.handle}
                >
                  {account.handle}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {meta.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDisconnect(account._id)}
                title="Disconnect account"
                aria-label={`Disconnect ${account.handle}`}
                className="size-9 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <UnplugIcon className="size-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-4" />

            {/* Connection Status */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {isConnected ? (
                  <CheckCircleIcon className="size-3.5" />
                ) : (
                  <AlertCircleIcon className="size-3.5" />
                )}

                {isConnected ? "Connected" : "Disconnected"}
              </div>

              <span className="text-[11px] text-slate-400">
                {isConnected ? "Active account" : "Needs attention"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccountList;
