import React from 'react'

interface DashboardOverviewProps {
  currentUser: any
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ currentUser }) => {
  // Metrics data
  const metrics = [
    {
      value: '4',
      label: 'Total Events',
      subtitle: '+2 this month',
      icon: 'bx-calendar',
      color: 'bg-olive-600'
    },
    {
      value: '645',
      label: 'Total Registrations',
      subtitle: '+2% from last month',
      icon: 'bx-group',
      color: 'bg-olive-600'
    },
    {
      value: '2',
      label: 'Active Events',
      subtitle: '1 ending soon',
      icon: 'bx-trending-up',
      color: 'bg-olive-600'
    },
    {
      value: '3',
      label: 'This Month',
      subtitle: '3 upcoming',
      icon: 'bx-calendar-check',
      color: 'bg-olive-600'
    }
  ]

  // Recent events data
  const recentEvents = [
    {
      title: 'web catalyst 2',
      date: 'September 18, 2025',
      registrations: '0/30 registered',
      progress: 0
    },
    {
      title: 'designathon c',
      date: 'September 15, 2025',
      registrations: '1/50 registered',
      progress: 2
    },
    {
      title: 'web catalyst',
      date: 'September 10, 2025',
      registrations: '0/20 registered',
      progress: 0
    }
  ]

  // Recent activity data
  const recentActivity = [
    {
      text: 'New registration for Tech Summit',
      time: '2 hours ago'
    },
    {
      text: 'Event description updated',
      time: '5 hours ago'
    },
    {
      text: 'Marketing event published',
      time: '1 day ago'
    }
  ]

  return (
    <div className="p-6 bg-olive-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-olive-800">Dashboard Overview</h1>
        <button className="bg-olive-600 hover:bg-olive-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center">
          <i className="bx bx-plus mr-2"></i>
          CREATE EVENT
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className={`${metric.color} rounded-xl p-6 text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="text-3xl font-bold mb-2">{metric.value}</div>
              <div className="text-olive-100 font-medium mb-1">{metric.label}</div>
              <div className="text-olive-200 text-sm">{metric.subtitle}</div>
            </div>
            <div className="absolute top-4 right-4 opacity-30">
              <i className={`bx ${metric.icon} text-4xl`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-olive-200">
            <div className="p-6 border-b border-olive-100">
              <h2 className="text-xl font-semibold text-olive-800">Recent Events</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {recentEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-olive-800 mb-1">{event.title}</h3>
                      <p className="text-sm text-olive-600 mb-2">{event.date}</p>
                      <p className="text-sm text-olive-500">{event.registrations}</p>
                    </div>
                    <div className="w-32 ml-4">
                      <div className="w-full bg-olive-100 rounded-full h-2">
                        <div 
                          className="bg-olive-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${event.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="w-full py-3 border border-olive-300 text-olive-700 rounded-lg hover:bg-olive-50 transition-colors duration-200">
                  VIEW ALL EVENTS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-olive-200">
            <div className="p-6 border-b border-olive-100">
              <h2 className="text-xl font-semibold text-olive-800">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full bg-olive-600 hover:bg-olive-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center">
                <i className="bx bx-plus mr-2"></i>
                CREATE NEW EVENT
              </button>
              <button className="w-full border border-olive-300 text-olive-700 py-3 px-4 rounded-lg hover:bg-olive-50 transition-colors duration-200 flex items-center justify-center">
                <i className="bx bx-group mr-2"></i>
                VIEW REGISTRATIONS
              </button>
              <button className="w-full border border-olive-300 text-olive-700 py-3 px-4 rounded-lg hover:bg-olive-50 transition-colors duration-200 flex items-center justify-center">
                <i className="bx bx-edit mr-2"></i>
                AI DESCRIPTION GENERATOR
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-olive-200">
            <div className="p-6 border-b border-olive-100">
              <h2 className="text-xl font-semibold text-olive-800">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex flex-col">
                    <p className="text-sm text-olive-800 mb-1">{activity.text}</p>
                    <p className="text-xs text-olive-500">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview