import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, trackFirebaseEvent } from '../lib/firebase'

type AuthValue = {
  user: User | null
  loading: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser)
    setLoading(false)
  }), [])

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    loginWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
      void trackFirebaseEvent('login', { method: 'password' })
    },
    registerWithEmail: async (email, password, displayName) => {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName })
      setUser(result.user)
      void trackFirebaseEvent('sign_up', { method: 'password' })
    },
    logout: async () => {
      await firebaseSignOut(auth)
      setUser(null)
      void trackFirebaseEvent('logout')
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
