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
  const [roleSpecificProfile, setRoleSpecificProfile] = useState(null)
  const [isAppLoading, setIsAppLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsAppLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsAppLoading(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function getProfileAndRoleSpecificData() {
      console.log('--- Fetching profiles in useEffect ---')
      setIsAppLoading(true)
      if (session?.user) {
        console.log('Session user exists:', session.user.id)
        // Fetch general profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setProfile(null)
          setRoleSpecificProfile(null)
          setIsAppLoading(false)
          return
        }

        console.log('Fetched profile:', profileData)
        setProfile(profileData)

        // Fetch role-specific profile if user_type is set
        if (profileData.user_type) {
          const tableName = profileData.user_type === 'publisher' ? 'publisher_profiles' : 'advertiser_profiles'
          console.log(`Fetching role-specific profile from: ${tableName}`)
          const { data: roleData, error: roleError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (roleError) {
            console.warn(`Error fetching ${profileData.user_type} profile:`, roleError)
            setRoleSpecificProfile(null)
          } else {
            console.log(`Fetched ${profileData.user_type} profile:`, roleData)
            setRoleSpecificProfile(roleData)
          }
        } else {
          console.log('User type not set in profile.')
          setRoleSpecificProfile(null)
        }
      } else {
        console.log('No session user.')
        setProfile(null)
        setRoleSpecificProfile(null)
      }
      setIsAppLoading(false)
    }

    if (session && (!profile || !roleSpecificProfile)) {
      getProfileAndRoleSpecificData();
    } else if (!session) {
      getProfileAndRoleSpecificData();
    }

  }, [session, profile, roleSpecificProfile])

  const handleUserTypeSelected = (userType) => {
    console.log('User type selected:', userType)
    setProfile((prev) => ({ ...prev, user_type: userType }))
  }

  const handleOnboardingComplete = () => {
    console.log('Onboarding complete, triggering re-fetch...')
    setProfile(null)
    setRoleSpecificProfile(null)
  }

  if (isAppLoading) {
    return <div className="container" style={{ padding: '50px 0 100px 0' }}>Loading application...</div>
  }

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!session ? (
        <Auth />
      ) : !profile || !profile.user_type ? (
        <UserTypeSelection session={session} onUserTypeSelected={handleUserTypeSelected} />
      ) : profile.user_type === 'publisher' && (!roleSpecificProfile || !roleSpecificProfile.company_name) ? (
        <PublisherOnboarding session={session} onComplete={handleOnboardingComplete} />
      ) : profile.user_type === 'advertiser' && (!roleSpecificProfile || !roleSpecificProfile.company_name) ? (
        <AdvertiserOnboarding session={session} onComplete={handleOnboardingComplete} />
      ) : (
        <Account key={session.user.id} session={session} />
      )}
    </div>
  )
}

export default App