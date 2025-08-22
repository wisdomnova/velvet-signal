// ./app/(auth)/auth/forgot-password/page.tsx

"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, CheckCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement password reset API call
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
      } else {
        setErrors({ submit: data.error || 'Failed to send reset email' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
    if (errors.submit) {
      setErrors({ ...errors, submit: '' });
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement resend logic
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setErrors({ submit: data.error || 'Failed to resend email' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f2f3f9' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="inline-flex items-center mb-6">
            <Image
              src="/velvet-signal.png"
              alt="Velvet Signal"
              width={40}
              height={40}
              className="mr-3"
            />
            <span className="text-2xl font-bold text-gray-900">Velvet Signal</span>
          </Link>
          
          {!isEmailSent ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot your password?
              </h1>
              <p className="text-gray-600">
                No worries, we'll send you reset instructions
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Check your email
              </h1>
              <p className="text-gray-600">
                We sent a password reset link to {email}
              </p>
            </>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {!isEmailSent ? (
            /* Email Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Email sent successfully!
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If an account with that email exists, we've sent you a link to reset your password. 
                  Please check your email and follow the instructions.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">Next steps:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Check your email inbox
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Click the reset link (valid for 24 hours)
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Create your new password
                  </li>
                </ul>
              </div>

              {/* Resend Button */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Resend Email'
                  )}
                </button>
              </div>

              {/* Submit Error for Resend */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div  
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link 
            href="/auth/sign-in" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to sign in
          </Link>
          
          <p className="text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}