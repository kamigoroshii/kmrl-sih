import React, { useState } from 'react'

const TestimonialsCarousel: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

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

  const nextTestimonial = () => {
    setCurrentTestimonial(currentTestimonial < testimonials.length - 1 ? currentTestimonial + 1 : 0)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial(currentTestimonial > 0 ? currentTestimonial - 1 : testimonials.length - 1)
  }

  return (
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
              onClick={prevTestimonial}
              className="w-12 h-12 bg-olive hover:bg-olive-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              aria-label="Previous testimonial"
            >
              <i className="bx bx-chevron-left text-xl"></i>
            </button>
            <button
              onClick={nextTestimonial}
              className="w-12 h-12 bg-olive hover:bg-olive-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              aria-label="Next testimonial"
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
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsCarousel
