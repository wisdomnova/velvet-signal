"use client";

import Image from "next/image";
import { Phone, MessageSquare, BarChart3, ArrowRight, Shield, Zap, Users, CheckCircle, Star, Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
                <Image
                  src="/velvet-signal.png"
                  alt="Velvet Signal"
                  width={50}
                  height={50}
                  className="mr-3"
                />
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Alata, sans-serif' }}>
                  Velvet Signal
                </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Reviews</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</a>
            </nav>
            <div className="flex items-center space-x-6">
              <Link href="/auth/sign-in" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h1 
            className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-10 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Business VOIP
            <br />
            <span className="text-gray-600">Made Simple</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-700 mb-16 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Manage your Twilio-powered communication with ease. Buy numbers, 
            make calls, send SMS, and track usage all in one dashboard.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/auth/sign-up" className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:border-gray-400 transition-colors flex items-center">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No setup fees
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              99.9% uptime SLA
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Enterprise security
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              See it in action
            </h2>
            <p className="text-xl text-gray-600">
              A preview of your powerful communication dashboard
            </p>
          </div>

          <motion.div 
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-5xl mx-auto font-mono"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#f2f3f9' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 font-mono">Dashboard Overview</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <Phone className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 font-mono">Voice Calls</h4>
                  <p className="text-sm text-gray-600 font-mono">Make & receive calls</p>
                  <div className="mt-2 text-xs text-gray-500 font-mono">142 calls this month</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <MessageSquare className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 font-mono">SMS Messages</h4>
                  <p className="text-sm text-gray-600 font-mono">Send & receive texts</p>
                  <div className="mt-2 text-xs text-gray-500 font-mono">1,247 messages sent</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 font-mono">Analytics</h4>
                  <p className="text-sm text-gray-600 font-mono">Track usage & costs</p>
                  <div className="mt-2 text-xs text-gray-500 font-mono">$23.45 this month</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section Introduction */}
      <section className="py-24" style={{ backgroundColor: '#f2f3f9' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Scale your business communication
              <br />
              <span className="text-gray-600">without the complexity</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From startups to enterprises, thousands of businesses rely on Velvet Signal to power their communication infrastructure with zero downtime and maximum reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Feature 1 - Crystal Clear Calls */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="flex flex-col lg:flex-row items-center gap-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Crystal Clear Voice Calls
              </h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Make and receive calls directly from your browser with HD voice quality powered by Twilio's global infrastructure. No downloads, no setup - just pure communication excellence.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Browser-based calling</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">HD voice quality</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Global infrastructure</span>
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 font-mono">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Active Call</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Live</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-semibold">JD</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">John Doe</div>
                      <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white transform rotate-45" />
                    </button>
                    <button className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Duration: 02:34
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2 - Smart SMS */}
      <section className="py-24" style={{ backgroundColor: '#f2f3f9' }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="flex flex-col lg:flex-row-reverse items-center gap-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex-1">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Smart SMS Messaging
              </h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Send bulk messages, automate responses, and manage conversations with an intuitive inbox interface. Scale your SMS campaigns effortlessly.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Bulk messaging</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Automated responses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Conversation management</span>
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 font-mono">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">SMS Inbox</h4>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">3 new</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">Sarah Wilson</span>
                        <span className="text-xs text-gray-500">2m ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Thanks for the quick response! When can we schedule a call?</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">Mike Johnson</span>
                        <span className="text-xs text-gray-500">5m ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Received the documents. Everything looks good!</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm">You</span>
                        <span className="text-xs text-gray-500">8m ago</span>
                      </div>
                      <p className="text-sm text-gray-700">Perfect! I'll send over the contract shortly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 3 - Analytics */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            className="flex flex-col lg:flex-row items-center gap-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex-1">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Real-time Analytics & Insights
              </h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Track call duration, message delivery rates, and costs with detailed reporting. Make data-driven decisions to optimize your communication strategy.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Real-time reporting</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Cost optimization</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Delivery tracking</span>
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 font-mono">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h4>
                    <span className="text-xs text-gray-500">Last 30 days</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">1,247</div>
                      <div className="text-xs text-gray-600">SMS Sent</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">142</div>
                      <div className="text-xs text-gray-600">Calls Made</div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Delivery Rate</span>
                      <span className="text-green-600">98.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '98.2%'}}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">$23.45</div>
                    <div className="text-xs text-gray-600">Total Cost This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24" style={{ backgroundColor: '#f2f3f9' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$9",
                description: "Perfect for small businesses",
                features: ["1 phone number", "100 minutes/month", "500 SMS/month", "Basic analytics", "Email support"]
              },
              {
                name: "Professional",
                price: "$29",
                description: "For growing businesses",
                features: ["3 phone numbers", "1,000 minutes/month", "2,000 SMS/month", "Advanced analytics", "Priority support", "Team management"],
                popular: true
              },
              {
                name: "Enterprise",
                price: "$99",
                description: "For large organizations",
                features: ["Unlimited numbers", "Unlimited minutes", "Unlimited SMS", "Custom analytics", "24/7 phone support", "Custom integrations", "SLA guarantee"]
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                className={`p-8 rounded-2xl border-2 ${plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} relative`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/sign-up" className={`w-full py-3 rounded-lg font-semibold transition-colors inline-block text-center ${
                  plan.popular 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by businesses worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "CEO, TechStart",
                content: "Velvet Signal transformed our communication workflow. The setup was incredibly easy and the call quality is outstanding.",
                rating: 5
              },
              {
                name: "Michael Rodriguez",
                role: "Operations Manager, LogiCorp",
                content: "The analytics dashboard gives us insights we never had before. We've reduced our communication costs by 40%.",
                rating: 5
              },
              {
                name: "Emily Johnson",
                role: "Founder, CreativeAgency",
                content: "Best VOIP solution we've used. The SMS features are particularly powerful for our client communications.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Ready to revolutionize your business communication?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join thousands of businesses already using Velvet Signal to streamline their VOIP operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up" className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <Image
                  src="/velvet-signal.png"
                  alt="Velvet Signal"
                  width={32}
                  height={32}
                  className="mr-3"
                />
                <span className="text-xl font-bold text-white">Velvet Signal</span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Professional VOIP solutions powered by Twilio. Streamline your business communication with our comprehensive dashboard.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status Page</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div> 
              <h4 className="font-semibold text-white mb-6">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Velvet Signal. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Security</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Compliance</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}