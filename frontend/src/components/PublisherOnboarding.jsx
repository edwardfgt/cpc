import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PublisherOnboarding({ session, onComplete }) {
    const [companyName, setCompanyName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { user } = session

        const { error } = await supabase
            .from('publisher_profiles')
            .upsert({
                id: user.id,
                company_name: companyName,
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
            <h2>Complete Publisher Profile</h2>
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
                <button className="button block" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Complete Profile'}
                </button>
            </div>
        </form>
    )
} 