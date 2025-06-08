import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import CreateNewsletter from './CreateNewsletter'
import EditNewsletter from './EditNewsletter'

export default function Account({ session }) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [showCreateNewsletter, setShowCreateNewsletter] = useState(false)
    const [newsletters, setNewsletters] = useState([])
    const [editingNewsletter, setEditingNewsletter] = useState(null)

    const fetchNewsletters = async () => {
        setLoading(true)
        const { user } = session
        if (user) {
            const { data, error } = await supabase
                .from('newsletters')
                .select('*')
                .eq('owner_id', user.id)

            if (error) {
                console.error('Error fetching newsletters:', error)
            } else {
                setNewsletters(data)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        let ignore = false
        async function getProfile() {
            setLoading(true)
            const { user } = session

            const { data, error } = await supabase
                .from('profiles')
                .select(`id, username, website, avatar_url, user_type`)
                .eq('id', user.id)
                .single()

            if (!ignore) {
                if (error) {
                    console.warn(error)
                } else if (data) {
                    setProfile(data)
                    if (data.user_type === 'publisher') {
                        fetchNewsletters()
                    }
                }
            }
            setLoading(false)
        }

        getProfile()

        return () => {
            ignore = true
        }
    }, [session])

    async function updateProfile(event) {
        event.preventDefault()
        setLoading(true)
        const { user } = session

        const updates = {
            id: user.id,
            username: profile?.username,
            website: profile?.website,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) {
            alert(error.message)
        }
        setLoading(false)
    }

    const handleNewsletterCreated = () => {
        setShowCreateNewsletter(false)
        fetchNewsletters()
    }

    const handleNewsletterEdited = () => {
        setEditingNewsletter(null)
        fetchNewsletters()
    }

    const handleEditCancel = () => {
        setEditingNewsletter(null)
    }

    if (loading) {
        return <div>Loading account details...</div>
    }

    return (
        <div className="form-widget">
            <h1>Your Account</h1>

            <form onSubmit={updateProfile}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="text" value={session.user.email} disabled />
                </div>
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        required
                        value={profile?.username || ''}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                </div>
                <div>
                    <label htmlFor="website">Website</label>
                    <input
                        id="website"
                        type="url"
                        value={profile?.website || ''}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    />
                </div>
                <div>
                    <button className="button block primary" type="submit" disabled={loading}>
                        {loading ? 'Loading ...' : 'Update Profile'}
                    </button>
                </div>
            </form>

            {profile?.user_type === 'publisher' && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Publisher Actions</h3>
                    {!showCreateNewsletter && !editingNewsletter ? (
                        <button className="button block" onClick={() => setShowCreateNewsletter(true)}>
                            Create New Newsletter
                        </button>
                    ) : showCreateNewsletter ? (
                        <CreateNewsletter session={session} onNewsletterCreated={handleNewsletterCreated} />
                    ) : editingNewsletter ? (
                        <EditNewsletter
                            session={session}
                            newsletter={editingNewsletter}
                            onEdited={handleNewsletterEdited}
                            onCancel={handleEditCancel}
                        />
                    ) : null}

                    {!showCreateNewsletter && !editingNewsletter && newsletters.length > 0 && (
                        <div style={{ marginTop: '30px' }}>
                            <h3>Your Newsletters</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                {newsletters.map((newsletter) => (
                                    <div
                                        key={newsletter.id}
                                        style={{
                                            border: '1px solid #ccc',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            width: '250px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => setEditingNewsletter(newsletter)}
                                    >
                                        <h4>{newsletter.name}</h4>
                                        <p>Description: {newsletter.description}</p>
                                        <p>Status: <strong>{newsletter.status.toUpperCase()}</strong></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!showCreateNewsletter && !editingNewsletter && newsletters.length === 0 && (
                        <p style={{ marginTop: '10px' }}>You haven't created any newsletters yet.</p>
                    )}
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <button className="button block" type="button" onClick={() => supabase.auth.signOut()}>
                    Sign Out
                </button>
            </div>
        </div>
    )
}