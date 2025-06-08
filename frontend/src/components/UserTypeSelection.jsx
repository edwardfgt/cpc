import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function UserTypeSelection({ session, onUserTypeSelected }) {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')

    const handleSubmit = async (userType) => {
        if (!username.trim()) {
            alert('Please enter a username.')
            return
        }

        setLoading(true)
        const { user } = session

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                username: username,
                user_type: userType,
            })

        setLoading(false)
        if (error) {
            console.error('Error upserting profile:', error)
            alert('Database error saving new user: ' + error.message)
        } else {
            if (onUserTypeSelected) onUserTypeSelected(userType)
        }
    }

    return (
        <div className="form-widget">
            <h2>Complete Your Profile</h2>
            <div>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="button-group">
                <button
                    className="button block"
                    onClick={() => handleSubmit('publisher')}
                    disabled={loading || !username.trim()}
                >
                    I'm a Publisher
                </button>
                <button
                    className="button block"
                    onClick={() => handleSubmit('advertiser')}
                    disabled={loading || !username.trim()}
                >
                    I'm an Advertiser
                </button>
            </div>
        </div>
    )
}
