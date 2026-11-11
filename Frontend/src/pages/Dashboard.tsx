import { ActivityIcon, CheckCircleIcon, ClockIcon, Share2Icon, TrendingUpIcon } from "lucide-react"
import { useState } from "react"

const Dashboard = () => {
  const [stats, setStats] = useState({ scheduled: 0, published: 0, connectedAccounts: 0 })
  const [activities, setActivities] = useState<any[]>([])
  const statCards = [
    {
      label: "Scheduled Posts",
      value: stats.scheduled,
      icon: ClockIcon,
      trend: "+2 today"
    },
    {
      label: "Published Posts",
      value: stats.published,
      icon: CheckCircleIcon,
      trend: "All Time"
    },
    {
      label: "Connected Accounts",
      value: stats.connectedAccounts,
      icon: Share2Icon,
      trend: "Active"
    }

  ]
  return (
    <div className="space-y-8">
      {/* Welcome Bar */}
      <div>
        <h2 className="text-2xl text-slate-900">Good Morning! </h2>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your social media accounts today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white hover:bg-red-50 relative border border-slate-200 rounded-2xl p-5 hover:border-red-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-medium text-slate-800 tabular-nums">{card.value}</div>
              <div className="text-xs absolute right-4 top-4 text-red-500 flex items-center gap-1">
                <TrendingUpIcon className="size-3" />
                {card.trend}
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      {/* Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2>Recent Activity </h2>
          <span>{activities.length} events</span>
        </div>
        {activities.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="size12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
            <ActivityIcon className="size-6 text-slate-400 m-2" />
          </div>
          <p className="text-sm text-slate-500">No activity yet</p>
          <p className="text-sm text-slate-500">Connect accounts and schedule posts to see events here.</p>
        </div>) :
          (<div></div>)}
      </div>

    </div>
  )
}

export default Dashboard