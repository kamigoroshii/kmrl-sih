import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const HeroSection: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)


  // Enhanced department overview with detailed descriptions
  const departmentOverview = [
    {
      id: 'operations',
      name: 'Operations',
      icon: (
        <i className="bx bx-cog text-3xl text-olive-700"></i>
      ),
      description: 'Manages operational workflows and ensures seamless document processing across all metro systems.'
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: (
        <i className="bx bx-dollar text-3xl text-olive-700"></i>
      ),
      description: 'Handles budget approvals, financial documents, and maintains fiscal transparency in all transactions.'
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: (
        <i className="bx bx-group text-3xl text-olive-700"></i>
      ),
      description: 'Oversees employee documentation, training records, and personnel management workflows.'
    },
    {
      id: 'engineering',
      name: 'Engineering',
      icon: (
        <i className="bx bx-wrench text-3xl text-olive-700"></i>
      ),
      description: 'Manages technical specifications, safety protocols, and infrastructure documentation.'
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
  const testimonials = [
    {
      quote: "The KMRL Document Management System has revolutionized how we handle project specifications. What used to take days now takes hours.",
      name: "Rajesh Kumar",
      role: "Senior Engineering Manager",
      department: "Engineering"
    },
    {
      quote: "Financial document processing is now seamless and transparent. The approval workflows have reduced processing time by 60%.",
      name: "Priya Menon",
      role: "Finance Director",
      department: "Finance"
    },
    {
      quote: "Managing employee records and training documentation has never been easier. The system keeps everything organized and accessible.",
      name: "Suresh Nair",
      role: "HR Operations Lead",
      department: "Human Resources"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-olive-100 via-olive-50 to-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-olive-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-olive-400 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-olive-200 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="mb-6">
             
            </div>
            
            <h1 className="text-6xl font-bold mb-6">
              <span className="text-gray-900">Welcome to </span>
              <span className="text-olive-600 bg-gradient-to-r from-olive-600 to-olive-700 bg-clip-text text-transparent">KMRL</span>
            </h1>
            
            <h2 className="text-4xl font-semibold text-olive-700 mb-8">
              Document Workflow Management System
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Streamline your document processes with our comprehensive workflow management 
              solution designed specifically for Kochi Metro Rail Limited. Experience efficiency, 
              security, and transparency in every workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/login"
                className="bg-gradient-to-r from-olive-600 to-olive-700 hover:from-olive-700 hover:to-olive-800 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started
                <i className="bx bx-right-arrow-alt ml-2 text-xl"></i>
              </Link>
              
              <button className="border-2 border-olive-600 text-olive-700 hover:bg-olive-600 hover:text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <i className="bx bx-play-circle mr-2"></i>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Department Overview Section */}
      <section className="py-20 bg-gradient-to-b from-white to-olive-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-olive-100 text-olive-700 rounded-full text-sm font-medium mb-4">
              <i className="bx bx-buildings mr-2"></i>
              Our Departments
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Department Overview
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Four key departments working together to ensure efficient document management 
              and seamless workflow coordination across KMRL.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {departmentOverview.map((dept, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-olive-100 hover:border-olive-300">
                  <div className="w-20 h-20 bg-gradient-to-br from-olive-500 to-olive-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {dept.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-olive-700 transition-colors duration-300">{dept.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{dept.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Description Section */}
      <section className="py-20 bg-gradient-to-r from-olive-600 to-olive-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-48 h-48 bg-olive-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-olive-800 bg-opacity-50 text-olive-100 rounded-full text-sm font-medium mb-6">
              <i className="bx bx-rocket mr-2"></i>
              Platform Description
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Transforming Document Management
            </h2>
            <h3 className="text-2xl font-light text-olive-100 mb-8">
              for Modern Transportation
            </h3>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-12 border border-olive-500">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-xl text-olive-50 leading-relaxed mb-12">
                Our comprehensive platform revolutionizes how Kochi Metro Rail Limited manages, processes, and secures critical documents. 
                By implementing intelligent workflow automation and centralized data management, we eliminate administrative bottlenecks 
                while ensuring complete transparency and accountability.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:bg-opacity-30 transition-all duration-300">
                    <i className="bx bx-trending-up text-3xl"></i>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-3">Streamlined Processes</h4>
                  <p className="text-olive-100 text-sm leading-relaxed">Reduce processing time by up to 70% with automated workflows</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:bg-opacity-30 transition-all duration-300">
                    <i className="bx bx-check-double text-3xl"></i>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-3">Reduced Administrative Burden</h4>
                  <p className="text-olive-100 text-sm leading-relaxed">Eliminate manual paperwork and repetitive tasks</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 group-hover:bg-opacity-30 transition-all duration-300">
                    <i className="bx bx-shield-check text-3xl"></i>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-3">Secure Centralized Data</h4>
                  <p className="text-olive-100 text-sm leading-relaxed">Enterprise-grade security with role-based access controls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Flow Section */}
      <section className="py-20 bg-gradient-to-b from-olive-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-olive-100 text-olive-700 rounded-full text-sm font-medium mb-4">
              <i className="bx bx-git-branch mr-2"></i>
              Workflow Process
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Document Flow
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Follow the seamless journey of documents through our intelligent workflow system 
              designed for maximum efficiency and transparency.
            </p>
          </div>

          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-8 lg:space-y-0 lg:space-x-4">
              {documentFlow.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative group">
                  {/* Step Circle */}
                  <div className="w-24 h-24 bg-gradient-to-br from-olive-500 to-olive-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 relative z-10 group-hover:scale-110 transition-all duration-300">
                    {step.icon}
                  </div>
                  
                  {/* Step Content */}
                  <div className="text-center max-w-xs">
                    <div className="w-10 h-10 bg-olive-600 rounded-xl flex items-center justify-center text-white text-sm font-bold mx-auto mb-4 shadow-lg">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-olive-700 transition-colors duration-300">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  
                  {/* Arrow connector (hidden on last item) */}
                  {index < documentFlow.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-olive-300 to-olive-400 transform translate-x-2 z-0">
                      <div className="absolute right-0 top-0 transform -translate-y-1/2">
                        <div className="w-3 h-3 bg-olive-400 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Team Says
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from KMRL professionals who experience the benefits of our document management system daily.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-olive-50 to-beige-50 rounded-xl p-8 mx-auto max-w-4xl">
                      <div className="text-center">
                        <i className="bx bxs-quote-alt-left text-5xl text-olive mx-auto mb-6"></i>
                        <blockquote className="text-xl text-gray-700 mb-6 italic">
                          "{testimonial.quote}"
                        </blockquote>
                        <div className="flex items-center justify-center space-x-4">
                          <div className="w-16 h-16 bg-olive rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900">{testimonial.name}</div>
                            <div className="text-gray-600">{testimonial.role}</div>
                            <div className="text-olive text-sm">{testimonial.department}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => setCurrentTestimonial(currentTestimonial > 0 ? currentTestimonial - 1 : testimonials.length - 1)}
                className="w-12 h-12 bg-olive hover:bg-olive-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <i className="bx bx-chevron-left text-xl"></i>
              </button>
              <button
                onClick={() => setCurrentTestimonial(currentTestimonial < testimonials.length - 1 ? currentTestimonial + 1 : 0)}
                className="w-12 h-12 bg-olive hover:bg-olive-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <i className="bx bx-chevron-right text-xl"></i>
              </button>
            </div>
            
            {/* Testimonial indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-olive' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-olive-600 via-olive-700 to-olive-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-olive-300 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-olive-400 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-olive-800 bg-opacity-50 text-olive-100 rounded-full text-sm font-medium mb-4">
              <i className="bx bx-trending-up mr-2"></i>
              Platform Statistics
            </div>
            <h2 className="text-3xl font-bold mb-4">Trusted by KMRL</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-olive-500 group-hover:bg-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-file text-2xl text-white"></i>
                </div>
                <div className="text-4xl font-bold mb-2">1000+</div>
                <div className="text-olive-200 font-medium">Documents Processed</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-olive-500 group-hover:bg-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-group text-2xl text-white"></i>
                </div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-olive-200 font-medium">Active Users</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-olive-500 group-hover:bg-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-buildings text-2xl text-white"></i>
                </div>
                <div className="text-4xl font-bold mb-2">4</div>
                <div className="text-olive-200 font-medium">Departments</div>
              </div>
            </div>
            <div className="group">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-olive-500 group-hover:bg-opacity-20 transition-all duration-300">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="bx bx-check-shield text-2xl text-white"></i>
                </div>
                <div className="text-4xl font-bold mb-2">99%</div>
                <div className="text-olive-200 font-medium">Uptime</div>
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
