import React from 'react'

const DepartmentOverview: React.FC = () => {
  const departmentOverview = [
    {
      id: 'operations',
      name: 'Operations',
      icon: (
        <i className="bx bx-cog text-3xl"></i>
      ),
      description: 'Manages operational workflows and ensures seamless document processing across all metro systems.'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: (
        <i className="bx bx-dollar text-3xl"></i>
      ),
      description: 'Handles budget approvals, financial documents, and maintains fiscal transparency in all transactions.'
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: (
        <i className="bx bx-group text-3xl"></i>
      ),
      description: 'Oversees employee documentation, training records, and personnel management workflows.'
    },
    {
      id: 'engineering',
      name: 'Engineering',
      icon: (
        <i className="bx bx-wrench text-3xl"></i>
      ),
      description: 'Manages technical specifications, safety protocols, and infrastructure documentation.'
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-olive-50 to-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Department Overview
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Four key departments working together to ensure efficient document management across KMRL.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {departmentOverview.map((dept, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-olive rounded-full flex items-center justify-center text-white mx-auto mb-6">
                {dept.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{dept.name}</h3>
              <p className="text-gray-600 leading-relaxed">{dept.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DepartmentOverview
