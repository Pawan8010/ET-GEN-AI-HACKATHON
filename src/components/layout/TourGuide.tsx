import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  MessageSquare, 
  FolderOpen, 
  Share2, 
  Wrench, 
  Shield, 
  Lightbulb, 
  BarChart3, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  HelpCircle, 
  Play, 
  Check, 
  Cpu 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../../context/AuthContext'

const TOUR_STEPS = [
  {
    to: '/copilot',
    title: 'OpsBrain Copilot AI',
    description: 'Your central command center. Engage in real-time, natural language conversations with the multi-agent system to fetch documents, analyze operations, and extract machine correlations.',
    icon: MessageSquare,
    accentColor: 'text-industrial-accent',
    bgAccent: 'bg-industrial-accent/15',
    borderColor: 'border-industrial-accent/30',
    glowColor: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
  },
  {
    to: '/documents',
    title: 'Operational Document Library',
    description: 'The core index. Securely upload engineering manuals, drone inspection logs, incident files, and LOTO procedures. Features filter chips for date, doc type, and project associations.',
    icon: FolderOpen,
    accentColor: 'text-industrial-purple',
    bgAccent: 'bg-industrial-purple/15',
    borderColor: 'border-industrial-purple/30',
    glowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
  },
  {
    to: '/insights',
    title: 'System Knowledge Insights',
    description: 'Monitor overall repository health. View real-time database sizing, active ingested sources, entity indexes, and overall system status summaries in an elegant console layout.',
    icon: BarChart3,
    accentColor: 'text-amber-400',
    bgAccent: 'bg-amber-400/15',
    borderColor: 'border-amber-400/30',
    glowColor: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
  },
  {
    to: '/graph',
    title: 'Relational Graph Explorer',
    description: 'Visualize cross-references interactively. Examine dynamic node networks mapping documents, active equipment tags (Compressor C-301), and standard industrial regulatory files.',
    icon: Share2,
    accentColor: 'text-cyan-400',
    bgAccent: 'bg-cyan-400/15',
    borderColor: 'border-cyan-400/30',
    glowColor: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
  },
  {
    to: '/rca',
    title: 'Root Cause Assistant (RCA)',
    description: 'Resolve process anomalies. Input thermal excursions or mechanical failures to generate standard, audit-ready root cause analysis logs backed by standard procedures.',
    icon: Wrench,
    accentColor: 'text-orange-400',
    bgAccent: 'bg-orange-400/15',
    borderColor: 'border-orange-400/30',
    glowColor: 'shadow-[0_0_20px_rgba(251,146,60,0.15)]',
  },
  {
    to: '/compliance',
    title: 'Compliance Ledger',
    description: 'Track regulatory compliance. Audit active manuals against strict safety codes like OSHA 1910.119 and environmental requirements to pinpoint operational standard coverage gaps.',
    icon: Shield,
    accentColor: 'text-emerald-400',
    bgAccent: 'bg-emerald-400/15',
    borderColor: 'border-emerald-400/30',
    glowColor: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
  },
  {
    to: '/lessons',
    title: 'Failure Intelligence & Lessons',
    description: 'Learn from historical anomalies. Explore indexed records detailing prior equipment repair findings, root-cause investigations, and preventive directives for facilities.',
    icon: Lightbulb,
    accentColor: 'text-yellow-400',
    bgAccent: 'bg-yellow-400/15',
    borderColor: 'border-yellow-400/30',
    glowColor: 'shadow-[0_0_20px_rgba(250,204,21,0.15)]',
  },
]

export function TourGuide() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasDismissedWelcome, setHasDismissedWelcome] = useState(false)

  const localStorageKey = user?.email ? `opsbrain_tour_completed_${user.email}` : 'opsbrain_tour_completed_guest'

  // Auto-trigger tour for first-time users upon login
  useEffect(() => {
    if (user) {
      const isCompleted = localStorage.getItem(localStorageKey)
      if (isCompleted !== 'true') {
        // Show a brief welcoming card before starting the tour
        setIsActive(true)
        setHasDismissedWelcome(false)
        setCurrentStep(0)
      }
    }
  }, [user, localStorageKey])

  // Navigate to corresponding route when step changes
  const handleStepChange = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
      setCurrentStep(stepIndex)
      navigate(TOUR_STEPS[stepIndex].to)
    }
  }

  const startTour = () => {
    setHasDismissedWelcome(true)
    setCurrentStep(0)
    navigate(TOUR_STEPS[0].to)
  }

  const completeTour = () => {
    setIsActive(false)
    localStorage.setItem(localStorageKey, 'true')
  }

  const forceStartTour = () => {
    setIsActive(true)
    setHasDismissedWelcome(true)
    setCurrentStep(0)
    navigate(TOUR_STEPS[0].to)
  }

  if (!user || !isActive) {
    // Return a floating helper button to restart tour at any time
    return (
      <button
        onClick={forceStartTour}
        title="Interactive System Tour"
        className="fixed bottom-20 md:bottom-5 right-5 z-40 p-3 rounded-full bg-industrial-900 border border-industrial-800 text-slate-400 hover:text-industrial-accent hover:border-industrial-accent/50 shadow-2xl backdrop-blur-md transition-all group flex items-center gap-2 cursor-pointer"
        id="tour-guide-fab"
      >
        <HelpCircle size={18} className="text-industrial-accent group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider pr-1 hidden sm:inline-block">
          Quick Tour
        </span>
      </button>
    )
  }

  const currentStepData = TOUR_STEPS[currentStep]
  const IconComponent = currentStepData.icon

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden pointer-events-none">
        
        {/* Semi-transparent Dimming Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black pointer-events-auto"
          onClick={completeTour}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-lg pointer-events-auto z-10">
          
          {!hasDismissedWelcome ? (
            /* Welcome / Onboarding Invitation Modal */
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-industrial-900 border border-industrial-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute right-4 top-4">
                <button 
                  onClick={completeTour}
                  className="p-1.5 rounded-xl bg-industrial-950 border border-industrial-800/80 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Graphical Top Accents */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-industrial-accent via-industrial-purple to-emerald-500" />
              
              <div className="flex flex-col items-center text-center gap-4 mt-2">
                <div className="p-3.5 rounded-2xl bg-industrial-accent/10 border border-industrial-accent/20 text-industrial-accent relative">
                  <Cpu size={32} className="animate-pulse" />
                  <div className="absolute inset-0 bg-industrial-accent/20 rounded-2xl blur-lg -z-10" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Welcome to OpsBrain <span className="text-industrial-accent">AI</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest font-bold">
                    System Intelligence Console
                  </p>
                </div>

                <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-1">
                  Let's take a quick 1-minute interactive tour of your new operational command dashboard. We'll guide you through our core analytics modules.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full mt-4">
                  <button
                    onClick={startTour}
                    className="flex-1 flex items-center justify-center gap-2 bg-industrial-accent hover:bg-industrial-accent/90 text-industrial-950 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    Begin System Tour
                  </button>
                  <button
                    onClick={completeTour}
                    className="flex-1 flex items-center justify-center bg-industrial-950 border border-industrial-800 hover:border-industrial-700 text-slate-400 hover:text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Skip &amp; Explore
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Interactive Tour Steps Cards */
            <motion.div
              layoutId="tour-card"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className={`bg-industrial-900 border border-industrial-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden ${currentStepData.glowColor} transition-all duration-300`}
            >
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-industrial-950 border border-industrial-850 px-2 py-0.5 rounded-lg">
                  STEP {currentStep + 1} OF {TOUR_STEPS.length}
                </span>
                <button 
                  onClick={completeTour}
                  className="p-1.5 rounded-xl bg-industrial-950 border border-industrial-800/80 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dynamic Step Accent Stripe */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-current ${currentStepData.accentColor}`} />

              <div className="flex items-start gap-4 mt-3">
                <div className={`p-3 rounded-2xl ${currentStepData.bgAccent} border ${currentStepData.borderColor} ${currentStepData.accentColor} shrink-0`}>
                  <IconComponent size={24} />
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {currentStepData.title}
                  </h4>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    Route: <span className="text-slate-400 lowercase">{currentStepData.to}</span>
                  </p>
                </div>
              </div>

              {/* Body Text */}
              <div className="my-5 bg-industrial-950/60 border border-industrial-850/50 rounded-2xl p-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Progress Dots & Navigation Controls */}
              <div className="flex items-center justify-between border-t border-industrial-800/50 pt-4 mt-2">
                
                {/* Dots indicator */}
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStepChange(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        currentStep === idx 
                          ? `w-4 ${currentStepData.accentColor} bg-current` 
                          : 'w-1.5 bg-industrial-800 hover:bg-industrial-700'
                      }`}
                      title={`Go to Step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStepChange(currentStep - 1)}
                    disabled={currentStep === 0}
                    className="p-2 rounded-xl border border-industrial-800 hover:border-industrial-700 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Previous Step"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {currentStep < TOUR_STEPS.length - 1 ? (
                    <button
                      onClick={() => handleStepChange(currentStep + 1)}
                      className="flex items-center gap-1 bg-industrial-800 hover:bg-industrial-750 text-slate-200 hover:text-white border border-industrial-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={completeTour}
                      className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-industrial-950 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Finish</span>
                    </button>
                  )}
                </div>

              </div>

            </motion.div>
          )}

        </div>
      </div>
    </AnimatePresence>
  )
}
