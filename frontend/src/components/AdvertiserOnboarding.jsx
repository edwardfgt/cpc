import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdvertiserOnboarding({ session, onComplete }) {
    const [companyName, setCompanyName] = useState('')
    const [companyDescription, setCompanyDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { user } = session
        const { error } = await supabase
            .from('advertiser_profiles')
            .upsert({
                id: user.id,
                company_name: companyName,
                company_description: companyDescription,
            })
        setLoading(false)
        if (error) {
            alert(error.message)
        } else {
            if (onComplete) onComplete()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="form-widget">
            <h2>Advertiser Onboarding</h2>
            <div>
                <label htmlFor="companyName">Company Name</label>
                <input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="companyDescription">Description</label>
                <textarea
                    id="companyDescription"
                    required
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                />
            </div>
            <div>
                <button className="button block" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Complete Onboarding'}
                </button>
            </div>
        </form>
    )
} 