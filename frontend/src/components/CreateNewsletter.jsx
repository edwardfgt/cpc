import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function CreateNewsletter({ session, onNewsletterCreated }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('') // Storing as a comma-separated string initially
    const [targetCpc, setTargetCpc] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { user } = session
        const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

        const { error } = await supabase.from('newsletters').insert([
            {
                owner_id: user.id,
                name,
                description,
                tags: parsedTags,
                target_cpc: parseFloat(targetCpc),
                status: 'pending', // Default status
                created_at: new Date().toISOString(),
            },
        ])

        setLoading(false)
        if (error) {
            alert(error.message)
        } else {
            alert('Newsletter created successfully and is pending approval!')
            setName('')
            setDescription('')
            setTags('')
            setTargetCpc('')
            if (onNewsletterCreated) onNewsletterCreated()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="form-widget">
            <h2>Create New Newsletter</h2>

            <div>
                <label htmlFor="name">Newsletter Name</label>
                <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="tags">Tags (comma-separated)</label>
                <input
                    id="tags"
                    type="text"
                    placeholder="e.g., tech, marketing, news"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="targetCpc">Target CPC</label>
                <input
                    id="targetCpc"
                    type="number"
                    step="0.01"
                    required
                    value={targetCpc}
                    onChange={(e) => setTargetCpc(e.target.value)}
                />
            </div>

            <div>
                <button className="button block primary" type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Newsletter'}
                </button>
            </div>
        </form>
    )
} 