import { useEffect, useState } from "react"
import { PLATFORMS, dummyAccountsData } from '../assets/assets';
import { PlusIcon } from "lucide-react"
import AccountList from "../components/AccountList"
import PlatfromPickerModal from "../components/PlatfromPickerModal";

const Accounts = () => {
  const [accounnts, setAccounts] = useState<any[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showPlatformPicker, setShowPlatformPicker] = useState<boolean>(false)

  const fetchAccounts = async(isSync = false, platfrom?: string | null, successMsg?: string)=>{
    setAccounts(dummyAccountsData)
    console.log(isSync, platfrom, successMsg)
  }

  useEffect(()=>{
    fetchAccounts()
  }, [])

  const handleConnect = async(platfromId: string)=>{
    setConnecting(platfromId)
    setTimeout(()=>{
      setConnecting(null)
      setAccounts((prev)=> [...prev, dummyAccountsData[0]])
      setShowPlatformPicker(false)
      
    }, 2000)
  }

  
  const handelDisconnect = async (accountId: string) => {
    setAccounts(accounnts.filter((a) => a._id !== accountId))
  }

  const connectedIds = accounnts.map((a)=> a.platform)



  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
        <div>
          <h2 className="text-xl text-slate-900">Connected Accounts</h2>
          <p className="text-slate-500 text-sm mt-0.5">{accounnts.length} of {PLATFORMS.length} Platforms connected</p>
        </div>
        <button onClick={() => setShowPlatformPicker(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all w-full sm:w-auto justify-center"><PlusIcon className="size-4" />Connect Account</button>
      </div>

      {/* Platform picker modal */}
      {
        showPlatformPicker && <PlatfromPickerModal connectedIds={connectedIds} connecting={connecting} onClose={()=> setShowPlatformPicker(false)} onConnect={handleConnect}/>
      }

      {/* Connected Accounts List */}
      <AccountList accounts={accounnts} onDisconnect={handelDisconnect}/>
    </div>
  )
}

export default Accounts