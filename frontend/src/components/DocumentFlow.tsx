import React from 'react'

const DocumentFlow: React.FC = () => {
  const documentFlow = [
    {
      step: 1,
      title: 'Upload',
      description: 'Submit documents to the system',
      icon: (
        <i className="bx bx-upload text-2xl"></i>
      )
    },
    {
      step: 2,
      title: 'Review',
      description: 'Department heads examine content',
      icon: (
        <i className="bx bx-clipboard text-2xl"></i>
      )
    },
    {
      step: 3,
      title: 'Approve',
      description: 'Authorized personnel grant approval',
      icon: (
        <i className="bx bx-check-circle text-2xl"></i>
      )
    },
    {
      step: 4,
      title: 'Archive',
      description: 'Securely store for future reference',
      icon: (
        <i className="bx bx-archive text-2xl"></i>
      )
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-beige-50 to-olive-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Document Flow
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Follow the seamless journey of documents through our intelligent workflow system.
          </p>
        </div>

        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-8 lg:space-y-0 lg:space-x-4">
            {documentFlow.map((step, index) => (
              <div key={index} className="flex flex-col items-center relative">
                {/* Step Circle */}
                <div className="w-20 h-20 bg-olive rounded-full flex items-center justify-center text-white shadow-lg mb-4 relative z-10">
                  {step.icon}
                </div>
                
                {/* Step Content */}
                <div className="text-center max-w-xs">
                  <div className="w-8 h-8 bg-brown rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                
                {/* Arrow connector (hidden on last item) */}
                {index < documentFlow.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-olive opacity-30 transform translate-x-2 z-0">
                    <div className="absolute right-0 top-0 transform -translate-y-1/2">
                      <svg className="w-4 h-4 text-olive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DocumentFlow
