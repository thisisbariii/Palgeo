import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  Menu, 
  X,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 
          'agent-id': string 
        }, 
        HTMLElement
      >;
    }
  }
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const testimonials = [
    {
      quote: "Palgeo transformed our field operations. We've seen a 40% increase in productivity and eliminated time theft completely.",
      author: "Sarah Chen",
      title: "Operations Manager",
      company: "BuildTech Solutions"
    },
    {
      quote: "The geofencing accuracy is incredible. Our clients love the real-time updates and transparency in our service delivery.",
      author: "Marcus Rodriguez",
      title: "Fleet Manager", 
      company: "Service Pro Inc"
    },
    {
      quote: "Implementation was seamless and the ROI was apparent within the first month. Highly recommend for any field-based business.",
      author: "Jennifer Kim",
      title: "CEO",
      company: "Green Maintenance Co"
    }
  ];

  // Load ElevenLabs script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      setWidgetLoaded(true);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Palgeo
                </span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                  How It Works
                </a>
                <a href="#testimonials" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                  Testimonials
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors">
                  Pricing
                </a>
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
                  Get Demo
                </button>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-indigo-600 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium">
                Features
              </a>
              <a href="#how-it-works" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium">
                How It Works
              </a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium">
                Testimonials
              </a>
              <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium">
                Pricing
              </a>
              <button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium">
                Get Demo
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 500+ businesses worldwide
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Geofencing
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Workforce Management
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your field operations with precision geofencing technology. Track, manage, and optimize your mobile workforce with real-time location intelligence and automated time tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all duration-300">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Workforce Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline operations, increase accountability, and boost productivity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Precision Geofencing</h3>
              <p className="text-gray-600 leading-relaxed">
                Create virtual boundaries around job sites with GPS accuracy. Automatically track when employees enter and exit designated areas with real-time notifications.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Automated Time Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Eliminate manual timesheets with automatic clock-in/out based on geofence entry. Generate accurate payroll reports and reduce time theft by up to 75%.
              </p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Get actionable insights with comprehensive dashboards. Track productivity metrics, identify trends, and make data-driven decisions to optimize operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Palgeo Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Set Up Geofences</h3>
              <p className="text-gray-600 leading-relaxed">
                Define virtual boundaries around your job sites, offices, or service areas using our intuitive map interface. Set custom rules for each location.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Invite Your Team</h3>
              <p className="text-gray-600 leading-relaxed">
                Send invitations to your employees to download the mobile app. They'll automatically start tracking when they enter designated work areas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Monitor & Optimize</h3>
              <p className="text-gray-600 leading-relaxed">
                View real-time employee locations, generate automated reports, and use insights to optimize your workforce management strategies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join hundreds of satisfied businesses who've transformed their operations with Palgeo
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 md:p-12">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-amber-500 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-xl md:text-2xl text-gray-800 text-center mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="text-center">
                <div className="font-semibold text-gray-900 text-lg">
                  {testimonials[currentTestimonial].author}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentTestimonial].title}, {testimonials[currentTestimonial].company}
                </div>
              </div>
            </div>
            
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-indigo-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with ElevenLabs Widget */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workforce Management?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Palgeo to streamline operations and boost productivity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 flex items-center">
              Request Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300">
              Start Free Trial
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-indigo-100 mb-12">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Setup in 5 minutes
            </div>
          </div>

          {/* ElevenLabs ConvAI Widget */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Have Questions? Chat with our AI Assistant</h3>
            <p className="text-indigo-200 text-lg mb-4">
              Click the chat icon in the bottom right corner to get instant help!
            </p>
            <p className="text-indigo-200 text-sm">
              Ask about features, pricing, or get help with implementation
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Palgeo</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Smart geofencing solutions for modern workforce management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Palgeo. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ElevenLabs ConvAI Widget - Floating Icon */}
      {widgetLoaded && (
        <elevenlabs-convai agent-id="agent_01jxf1ts2qfjcryfmvvzzadpwn"></elevenlabs-convai>
      )}
    </div>
  );
}

export default App;