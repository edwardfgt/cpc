import './App.css'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/auth'
import Account from './components/Account'
import UserTypeSelection from './components/UserTypeSelection'
import PublisherOnboarding from './components/PublisherOnboarding'
import AdvertiserOnboarding from './components/AdvertiserOnboarding'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [onboardingComplete, setOnboardingComplete] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (session?.user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            setProfile(null)
          } else {
            setProfile(data)
          }
        })
    } else {
      setProfile(null)
    }
  }, [session, onboardingComplete])

  const handleUserTypeSelected = (userType) => {
    setProfile((prev) => ({ ...prev, user_type: userType }))
  }

  const handleOnboardingComplete = () => {
    setOnboardingComplete((prev) => !prev)
  }

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!session ? (
        <Auth />
      ) : !profile || !profile.user_type ? (
        <UserTypeSelection session={session} onUserTypeSelected={handleUserTypeSelected} />
      ) : profile.user_type === 'publisher' && !onboardingComplete ? (
        <PublisherOnboarding session={session} onComplete={handleOnboardingComplete} />
      ) : profile.user_type === 'advertiser' && !onboardingComplete ? (
        <AdvertiserOnboarding session={session} onComplete={handleOnboardingComplete} />
      ) : (
        <Account key={session.user.id} session={session} />
      )}
    </div>
  )
}

export default App