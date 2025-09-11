import React from 'react'
import { Link } from 'react-router-dom'
import RecentActivityFeed from './Recentactivityfeed'

interface HeroSectionProps {
  onDepartmentLogin?: (departmentId: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDepartmentLogin }) => {



  // Enhanced department overview with detailed descriptions
  const departmentOverview = [
    {
      id: 'operations',
      name: 'Maintenance & Operations',
      icon: (
        <i className="bx bx-cog text-3xl text-olive-700"></i>
      ),
      description: 'Manages operational workflows and ensures seamless document processing across all metro systems.',
      url: 'https://kochimetro.org/operations/'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: (
        <i className="bx bx-dollar text-3xl text-olive-700"></i>
      ),
      description: 'Handles budget approvals, financial documents, and maintains fiscal transparency in all transactions.',
      url: 'https://kochimetro.org/finance/'
    },
    {
      id: 'procurement',
      name: 'Procurement',
      icon: (
        <i className="bx bx-package text-3xl text-olive-700"></i>
      ),
      description: 'Oversees purchasing, vendor management, and ensures timely procurement of goods and services.',
      url: 'https://kochimetro.org/procurement/'
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: (
        <i className="bx bx-group text-3xl text-olive-700"></i>
      ),
      description: 'Oversees employee documentation, training records, and personnel management workflows.',
      url: 'https://kochimetro.org/hr/'
    },
    {
      id: 'engineering',
      name: 'Engineering',
      icon: (
        <i className="bx bx-wrench text-3xl text-olive-700"></i>
      ),
      description: 'Manages technical specifications, safety protocols, and infrastructure documentation.',
      url: 'https://kochimetro.org/engineering/'
    }
  ]

  // Document flow steps
  const documentFlow = [
    {
      step: 1,
      title: 'Upload',
      description: 'Submit documents to the system',
      icon: (
        <i className="bx bx-upload text-2xl text-olive-700"></i>
      )
    },
    {
      step: 2,
      title: 'Review',
      description: 'Department heads examine content',
      icon: (
        <i className="bx bx-clipboard text-2xl text-olive-700"></i>
      )
    },
    {
      step: 3,
      title: 'Approve',
      description: 'Authorized personnel grant approval',
      icon: (
        <i className="bx bx-check-circle text-2xl text-olive-700"></i>
      )
    },
    {
      step: 4,
      title: 'Archive',
      description: 'Securely store for future reference',
      icon: (
        <i className="bx bx-archive text-2xl text-olive-700"></i>
      )
    }
  ]

  // Testimonials data


  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="min-h-screen relative overflow-hidden flex items-center">
        {/* Metro Background Image */}
        <img src="/metrobgtrain.jpg" alt="Kochi Metro Train Background" className="absolute inset-0 w-full h-full object-cover object-center z-0" style={{pointerEvents: 'none'}} />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0 pointer-events-none"></div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-olive-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-olive-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-olive-200 rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="mb-6"></div>
            <h1 className="text-6xl font-bold mb-6 text-white">
              <span className="">Welcome to </span>
              <span className="text-white">KMRL</span>
            </h1>
            <h2 className="text-4xl font-semibold text-white mb-8">
              Document Workflow Management System
            </h2>
            <p className="text-xl text-white mb-12 max-w-4xl mx-auto leading-relaxed">
              Streamline your document processes with our comprehensive workflow management 
              solution designed specifically for Kochi Metro Rail Limited. Experience efficiency, 
              security, and transparency in every workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => onDepartmentLogin && onDepartmentLogin('')}
                className="bg-gradient-to-r from-olive-600 to-olive-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-flex items-center justify-center shadow-lg focus:outline-none focus:ring-4 focus:ring-olive-400 hover:from-olive-700 hover:to-olive-800 hover:scale-105 hover:shadow-2xl active:scale-95 active:bg-olive-800"
              >
                <span>Explore Dashboard</span>
                <i className="bx bx-right-arrow-alt text-xl ml-2 transition-transform duration-300 group-hover:translate-x-1"></i>
              </button>
              <a
                href="https://kochimetro.org/about-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-olive-600 bg-transparent text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-olive-400 hover:bg-olive-600 hover:text-olive-50 hover:scale-105 hover:shadow-2xl active:scale-95 active:bg-olive-700 learn-more-btn inline-flex items-center justify-center"
              >
                <i className="bx bx-play-circle mr-2 transition-transform duration-300 group-hover:scale-110"></i>
                <span>Learn More</span>
              </a>
              <style>{`
                .learn-more-btn, .learn-more-btn:hover, .learn-more-btn:focus {
                  color: #fff !important;
                }
                .learn-more-btn .bx {
                  color: #fff !important;
                }
              `}</style>
            </div>
          </div>
        </div>
      </section>

  {/* Department Overview Section */}
  <section className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white to-olive-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* Removed 'Our Departments' label as requested */}
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Department Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Five key departments working together to ensure efficient document management 
              and seamless workflow coordination across KMRL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {departmentOverview.map((dept, index) => (
              <div key={index} className="group" tabIndex={0} role="region" aria-label={`Login to ${dept.name}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onDepartmentLogin && onDepartmentLogin(dept.id); } }}>
                <div
                  className="block rounded-2xl shadow-lg p-8 text-center transition-all duration-500 border border-olive-300 focus:ring-4 focus:ring-olive-400 group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-olive-600 group-active:scale-95 group-active:bg-olive-100 bg-gradient-to-br from-olive-50 to-olive-200 group-hover:from-olive-200 group-hover:to-olive-400"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-olive-600 to-olive-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 transition-transform duration-300 shadow-lg group-hover:scale-110 group-hover:bg-olive-800 group-active:scale-95">
                    {dept.icon}
                  </div>
                  <h3 className="text-xl font-bold text-olive-800 mb-4 transition-colors duration-300 group-hover:text-olive-900 group-active:text-olive-900">{dept.name}</h3>
                  <p className="text-olive-700 leading-relaxed group-hover:text-olive-900 group-active:text-olive-900 mb-6">{dept.description}</p>
                  <button
                    onClick={() => onDepartmentLogin && onDepartmentLogin(dept.id)}
                    className="mt-2 bg-gradient-to-r from-olive-600 to-olive-700 text-white px-6 py-2 rounded-lg font-semibold text-base transition-all duration-300 shadow focus:outline-none focus:ring-2 focus:ring-olive-400 hover:from-olive-700 hover:to-olive-800 hover:scale-105 hover:shadow-xl active:scale-95 active:bg-olive-800"
                    aria-label={`Login to ${dept.name}`}
                  >
                    Login
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Document Flow Section */}
  <section className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-olive-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Document Flow
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Follow the seamless journey of documents through our intelligent workflow system 
              designed for maximum efficiency and transparency.
            </p>
          </div>

          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-12 lg:space-y-0 lg:space-x-0">
              {documentFlow.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative group w-full lg:w-auto">
                  {/* Step Circle with pulse and shadow */}
                  <div className="w-24 h-24 bg-gradient-to-br from-olive-500 to-olive-600 rounded-full flex items-center justify-center text-white shadow-2xl mb-6 relative z-10 transition-transform duration-300 animate-fade-in group-hover:scale-110 group-hover:bg-olive-700 group-active:scale-95">
                    <span className="absolute w-32 h-32 rounded-full bg-olive-200 opacity-20 animate-ping group-hover:bg-olive-400"></span>
                    <span className="relative z-10">{step.icon}</span>
                  </div>
                  {/* Step Number with highlight */}
                  <div className="w-12 h-12 bg-white border-4 border-olive-500 rounded-full flex items-center justify-center text-olive-700 text-xl font-extrabold mx-auto mb-4 shadow-xl animate-fade-in transition-colors duration-300 group-hover:border-olive-700 group-active:border-olive-900">
                    {step.step}
                  </div>
                  {/* Step Content */}
                  <div className="text-center max-w-xs">
                    <h3 className="text-2xl font-bold text-olive-700 mb-2 transition-colors duration-300 group-hover:text-olive-900 group-active:text-olive-900 animate-fade-in">{step.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed transition-colors duration-300 group-hover:text-olive-800 group-active:text-olive-900 animate-fade-in-slow">{step.description}</p>
                  </div>
                  {/* Animated Arrow connector (hidden on last item) */}
                  {index < documentFlow.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 right-0 left-full w-32 h-0.5 bg-gradient-to-r from-olive-300 to-olive-500 z-0 animate-grow-x group-hover:bg-olive-500 group-active:bg-olive-700">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 8 H28 M28 8 L24 4 M28 8 L24 12" stroke="#7C8B3D" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Animations */}
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: none; }
              }
              @keyframes fade-in-slow {
                from { opacity: 0; transform: translateY(40px); }
                to { opacity: 1; transform: none; }
              }
              @keyframes grow-x {
                from { width: 0; }
                to { width: 8rem; }
              }
              .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
              .animate-fade-in-slow { animation: fade-in-slow 1.2s cubic-bezier(.4,0,.2,1) both; }
              .animate-grow-x { animation: grow-x 1s cubic-bezier(.4,0,.2,1) both; }
            `}</style>
          </div>
        </div>
      </section>


      {/* Recent Activity Feed Section (formerly Department Document Overview) */}
  <section className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-olive-50">
    {/* Cool Background Pattern */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute top-10 left-10 w-96 h-96 bg-olive-300 opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-olive-500 opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-white opacity-10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
    </div>
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
      {/* Centered Section Title */}
  <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Recent Activity Feed</h2>
      {/* Prominent Feed Box */}
  <div className="w-full rounded-3xl p-10 relative">
        <RecentActivityFeed />
      </div>
    </div>
  </section>

      {/* Testimonials Section */}
  <section className="min-h-[80vh] py-20 md:py-28 bg-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Employee Testimonies</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Real feedback from KMRL employees about their experience with our platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white bg-opacity-90 rounded-2xl p-8 flex flex-col items-center shadow-lg border border-olive-200 hover:-translate-y-2 transition-transform duration-300">
              <blockquote className="text-lg text-olive-900 mb-6">
                <span className="font-bold text-olive-700 text-xl block mb-2">“The best platform for document management”</span>
                The new system has made our daily work so much easier. Everything is organized, and approvals are faster than ever. Highly recommended!
              </blockquote>
              <div className="flex items-center mt-auto">
                <img src="/KMRL-logo.png" alt="Employee" className="w-14 h-14 rounded-full border-2 border-olive-400 mr-4 object-cover bg-white" />
                <div>
                  <div className="font-bold text-olive-700 text-lg">Anjali Menon</div>
                  <div className="text-olive-600 text-sm">Engineering, KMRL</div>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white bg-opacity-90 rounded-2xl p-8 flex flex-col items-center shadow-lg border border-olive-200 hover:-translate-y-2 transition-transform duration-300">
              <blockquote className="text-lg text-olive-900 mb-6">
                <span className="font-bold text-olive-700 text-xl block mb-2">“Efficient and user-friendly”</span>
                I can track every document and workflow with ease. The interface is clean, and the chatbot is a real time-saver for our team.
              </blockquote>
              <div className="flex items-center mt-auto">
                <img src="/KMRL-logo.png" alt="Employee" className="w-14 h-14 rounded-full border-2 border-olive-400 mr-4 object-cover bg-white" />
                <div>
                  <div className="font-bold text-olive-700 text-lg">Ravi Kumar</div>
                  <div className="text-olive-600 text-sm">Finance, KMRL</div>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white bg-opacity-90 rounded-2xl p-8 flex flex-col items-center shadow-lg border border-olive-200 hover:-translate-y-2 transition-transform duration-300">
              <blockquote className="text-lg text-olive-900 mb-6">
                <span className="font-bold text-olive-700 text-xl block mb-2">“A game changer for HR”</span>
                Managing employee records and approvals is now seamless. The platform is secure, and support is always available when needed.
              </blockquote>
              <div className="flex items-center mt-auto">
                <img src="/KMRL-logo.png" alt="Employee" className="w-14 h-14 rounded-full border-2 border-olive-400 mr-4 object-cover bg-white" />
                <div>
                  <div className="font-bold text-olive-700 text-lg">Meera Suresh</div>
                  <div className="text-olive-600 text-sm">Human Resources, KMRL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



  {/* CTA Section removed as requested */}
    </div>
  )
}

export default HeroSection
