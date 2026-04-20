import React, { useState, useEffect } from 'react';
import { 
    MdPsychology, MdCheck, MdClear, MdRefresh, 
    MdHistory, MdFactCheck, MdErrorOutline, MdRadar
} from 'react-icons/md';

const ActiveLearning = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Species dictionary for correction buttons
    const speciesList = ["Elephant", "Giraffe", "Zebra", "Lion", "Hyena", "Buffalo", "Human"];

    const fetchQueue = () => {
        fetch("http://localhost:8000/active-learning")
            .then(res => res.json())
            .then(data => {
                setQueue(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch queue:", err);
                setMessage("Error connecting to server.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    const handleReview = async (index, correctedLabel) => {
        try {
            const response = await fetch("http://localhost:8000/active-learning/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    index: index,
                    correct_label: correctedLabel
                })
            });
            if (response.ok) {
                // Instantly update UI for better feedback
                const updatedQueue = [...queue];
                updatedQueue[index].status = "reviewed";
                updatedQueue[index].corrected_label = correctedLabel;
                setQueue(updatedQueue);
                setMessage(`Labeled as ${correctedLabel}`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error("Review failed:", err);
            setMessage("Failed to update item.");
        }
    };

    const clearQueue = async () => {
        if (!window.confirm("Are you sure you want to clear the active learning queue?")) return;
        try {
            const response = await fetch("http://localhost:8000/active-learning/clear", {
                method: "POST"
            });
            if (response.ok) {
                setQueue([]);
                setMessage("Queue cleared!");
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error("Clear failed:", err);
        }
    };

    if (loading && queue.length === 0) return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Scanning intelligence queue for uncertain detections...</p>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>
                        <MdPsychology style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 
                        Active Learning Pipeline
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Expert-in-the-loop review for low-confidence federated detections.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={fetchQueue}>
                        <MdRefresh /> Reload
                    </button>
                    <button className="btn btn-secondary" onClick={clearQueue} style={{ color: 'var(--accent-rose)' }}>
                        <MdClear /> Clear Queue
                    </button>
                </div>
            </div>

            {message && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: 'var(--accent-purple)', color: 'white',
                    padding: '12px 24px', borderRadius: '12px', zIndex: 1000,
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'popIn 0.3s ease-out'
                }}>
                    {message}
                </div>
            )}

            {queue.length === 0 ? (
                <div className="glass-card" style={{ marginTop: '40px', textAlign: 'center', padding: '100px 24px', background: 'rgba(168, 85, 247, 0.05)' }}>
                    <MdFactCheck size={64} style={{ color: 'var(--accent-emerald)', marginBottom: '24px' }} />
                    <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Intelligence Queue Empty</h3>
                    <p style={{ color: 'var(--text-muted)' }}>The current federated models are reporting high certainty across all edge nodes.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '24px'
                }}>
                    {queue.map((item, index) => (
                        <div key={index} className="glass-card" style={{ padding: 0, overflow: 'hidden', opacity: item.status === 'reviewed' ? 0.7 : 1 }}>
                            <div style={{ height: '220px', width: '100%', position: 'relative', background: '#000' }}>
                                <img 
                                    src={`data:image/jpeg;base64,${item.image}`} 
                                    alt="Detection" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                                {item.status === 'reviewed' && (
                                    <div style={{
                                        position: 'absolute', top: '16px', right: '16px',
                                        background: 'var(--accent-emerald)', color: 'white',
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                        display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-md)'
                                    }}>
                                        <MdCheck /> VALIDATED
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>System Prediction</div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'capitalize', color: '#fff' }}>{item.predicted_label}</h3>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence</div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-rose)' }}>{(item.confidence * 100).toFixed(0)}%</h3>
                                    </div>
                                </div>

                                {item.status !== 'reviewed' ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <MdRadar style={{ color: 'var(--accent-purple)' }} />
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Expert Labeling Required:</span>
                                        </div>
                                        <div style={{ 
                                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' 
                                        }}>
                                            {speciesList.map(label => (
                                                <button 
                                                    key={label}
                                                    className="btn btn-secondary"
                                                    onClick={() => handleReview(index, label)}
                                                    style={{ fontSize: '10px', padding: '8px 4px', background: 'rgba(255,255,255,0.03)' }}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ 
                                        padding: '16px', background: 'rgba(16, 185, 129, 0.08)', 
                                        borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)',
                                        display: 'flex', alignItems: 'center', gap: '12px'
                                    }}>
                                        <MdCheckCircle color="var(--accent-emerald)" size={20} />
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expert Decision</div>
                                            <div style={{ fontSize: '14px', fontWeight: 600 }}>Corrected to: {item.corrected_label}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveLearning;
