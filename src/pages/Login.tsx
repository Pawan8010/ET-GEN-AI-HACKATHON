import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight } from 'lucide-react'

function authenticationErrorMessage(error: unknown): string {
  const authError = error as { code?: string; message?: string }
  if (authError?.code === 'auth/operation-not-allowed') {
    return 'Email/password authentication is disabled. Enable it in Firebase Console → Authentication → Sign-in method.'
  }
  if (authError?.code === 'auth/invalid-credential') {
    return 'The email or password is incorrect. Check the credentials and try again.'
  }
  return authError?.message || 'Authentication failed. Please verify the Firebase configuration.'
}

export function Login() {
  const { loginWithEmail, registerWithEmail } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (isRegister && !displayName) {
      setError('Please enter a display name.')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        await registerWithEmail(email, password, displayName)
        setSuccess('Registration successful! Logging you in...')
      } else {
        await loginWithEmail(email, password)
        setSuccess('Welcome back!')
      }
    } catch (err: any) {
      console.error(err)
      setError(authenticationErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-industrial-950 px-4 relative overflow-hidden font-sans cyber-grid">
      {/* Background abstract glowing circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-industrial-accent/5 filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-industrial-purple/5 filter blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-md z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-industrial-accent/10 border border-industrial-accent/20 mb-4 shadow-lg shadow-industrial-accent/5 relative"
          >
            <Shield size={32} className="text-industrial-accent glow-text-cyan" />
            <div className="absolute inset-0 bg-industrial-accent/20 rounded-2xl blur-md -z-10 animate-pulse" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            OpsBrain <span className="text-industrial-accent">AI</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-sans">
            Industrial Knowledge Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-industrial-900/60 backdrop-blur-xl border border-industrial-800 rounded-2xl p-8 shadow-2xl shadow-black/40 cyber-panel-glow">
          {/* Tabs */}
          <div className="flex bg-industrial-950 p-1 rounded-xl mb-6 border border-industrial-800">
            <button
              onClick={() => {
                setIsRegister(false)
                setError(null)
              }}
              className={`flex-grow py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                !isRegister ? 'bg-industrial-800 text-industrial-accent shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true)
                setError(null)
              }}
              className={`flex-grow py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                isRegister ? 'bg-industrial-800 text-industrial-accent shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form Alerts */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2.5 items-start bg-red-950/40 border border-red-900/50 text-red-300 rounded-xl px-4 py-3 text-xs mb-5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2.5 items-start bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 rounded-xl px-4 py-3 text-xs mb-5"
            >
              <Shield size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </motion.div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-industrial-950 border border-industrial-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-industrial-accent/50 focus:ring-1 focus:ring-industrial-accent/50 outline-none transition"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-industrial-accent/50 focus:ring-1 focus:ring-industrial-accent/50 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-industrial-accent/50 focus:ring-1 focus:ring-industrial-accent/50 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-industrial-accent text-industrial-950 font-bold hover:brightness-110 transition shadow-lg shadow-industrial-accent/15 disabled:opacity-50 text-xs uppercase tracking-wider"
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-[10px] text-slate-600 font-mono">
            OpsBrain Secured Access Gateway • ET AI Hackathon 2026
          </p>
        </div>
      </motion.div>
    </div>
  )
}
