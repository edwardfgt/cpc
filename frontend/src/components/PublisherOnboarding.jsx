import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PublisherOnboarding({ session, onComplete }) {
    const [newsletterName, setNewsletterName] = useState('')
    const [newsletterDescription, setNewsletterDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { user } = session
        const { error } = await supabase
            .from('publisher_profiles')
            .upsert({
                id: user.id,
                newsletter_name: newsletterName,
                newsletter_description: newsletterDescription,
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
            <h2>Publisher Onboarding</h2>
            <div>
                <label htmlFor="newsletterName">Newsletter Name</label>
                <input
                    id="newsletterName"
                    type="text"
                    required
                    value={newsletterName}
                    onChange={(e) => setNewsletterName(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="newsletterDescription">Description</label>
                <textarea
                    id="newsletterDescription"
                    required
                    value={newsletterDescription}
                    onChange={(e) => setNewsletterDescription(e.target.value)}
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