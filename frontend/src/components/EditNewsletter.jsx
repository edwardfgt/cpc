import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function EditNewsletter({ session, newsletter, onEdited, onCancel }) {
    const [name, setName] = useState(newsletter.name || '')
    const [description, setDescription] = useState(newsletter.description || '')
    const [tags, setTags] = useState(newsletter.tags ? newsletter.tags.join(', ') : '')
    const [targetCpc, setTargetCpc] = useState(newsletter.target_cpc || '')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setName(newsletter.name || '')
        setDescription(newsletter.description || '')
        setTags(newsletter.tags ? newsletter.tags.join(', ') : '')
        setTargetCpc(newsletter.target_cpc || '')
    }, [newsletter])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

        const updates = {
            id: newsletter.id,
            name,
            description,
            tags: parsedTags,
            target_cpc: parseFloat(targetCpc),
            // status and owner_id are not changed here, managed by backend or initial creation
        }

        const { error } = await supabase
            .from('newsletters')
            .update(updates)
            .eq('id', newsletter.id)

        setLoading(false)
        if (error) {
            alert(error.message)
        } else {
            alert('Newsletter updated successfully!')
            if (onEdited) onEdited()
        }
    }

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this newsletter application?')) {
            setLoading(true);
            const { error } = await supabase
                .from('newsletters')
                .delete()
                .eq('id', newsletter.id);

            setLoading(false);
            if (error) {
                alert('Error deleting newsletter: ' + error.message);
                console.error('Error deleting newsletter:', error);
            } else {
                alert('Newsletter application deleted successfully!');
                if (onEdited) onEdited(); // Call onEdited to refresh the list and close the form
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-widget">
            <h2>Edit Newsletter: {newsletter.name}</h2>

            <div>
                <label htmlFor="editName">Newsletter Name</label>
                <input
                    id="editName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="editDescription">Description</label>
                <textarea
                    id="editDescription"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="editTags">Tags (comma-separated)</label>
                <input
                    id="editTags"
                    type="text"
                    placeholder="e.g., tech, marketing, news"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="editTargetCpc">Target CPC</label>
                <input
                    id="editTargetCpc"
                    type="number"
                    step="0.01"
                    required
                    value={targetCpc}
                    onChange={(e) => setTargetCpc(e.target.value)}
                />
            </div>

            <div>
                <button className="button block primary" type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Update Newsletter'}
                </button>
                <button className="button block" type="button" onClick={onCancel} style={{ marginTop: '10px' }}>
                    Cancel
                </button>
                {newsletter.status === 'pending' && (
                    <button
                        className="button block"
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                        style={{ backgroundColor: '#dc3545', color: 'white', marginTop: '10px' }}
                    >
                        Delete Application
                    </button>
                )}
            </div>
        </form>
    )
} 