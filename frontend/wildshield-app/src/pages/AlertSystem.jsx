import React, { useState, useEffect } from 'react';
import { 
    MdNotificationsActive, MdAccessTime, MdShield, 
    MdErrorOutline, MdWarningAmber, MdInfoOutline, MdDeleteSweep 
} from 'react-icons/md';

const AlertSystem = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            const response = await fetch('http://localhost:8000/alerts');
            const data = await response.json();
            setAlerts(data);
        } catch (err) {
            console.error("Failed to fetch alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    const clearAlerts = async () => {
        try {
            await fetch('http://localhost:8000/alerts/clear', { method: 'POST' });
            setAlerts([]);
        } catch (err) {
            console.error("Failed to clear alerts:", err);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    const getAlertStyle = (type) => {
        switch(type) {
            case 'poaching':
                return { 
                    borderLeft: '4px solid #f43f5e', 
                    background: 'rgba(244, 63, 94, 0.05)',
                    icon: <MdErrorOutline size={28} color="#f43f5e" />
                };
            case 'rare':
                return { 
                    borderLeft: '4px solid #f59e0b', 
                    background: 'rgba(245, 158, 11, 0.05)',
                    icon: <MdWarningAmber size={28} color="#f59e0b" />
                };
            case 'detection':
                return { 
                    borderLeft: '4px solid #3b82f6', 
                    background: 'rgba(59, 130, 246, 0.05)',
                    icon: <MdInfoOutline size={28} color="#3b82f6" />
                };
            default:
                return { 
                    borderLeft: '4px solid #94a3b8', 
                    background: 'rgba(148, 163, 184, 0.05)',
                    icon: <MdInfoOutline size={28} color="#94a3b8" />
                };
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1><MdNotificationsActive style={{ marginRight: '10px' }} /> AI Monitoring Feed</h1>
                    <p>Real-time alerts generated dynamically from YOLOv8 edge detection.</p>
                </div>
                <button onClick={clearAlerts} className="btn-secondary" style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', color: '#fff', cursor: 'pointer'
                }}>
                    <MdDeleteSweep size={18} /> Clear Feed
                </button>
            </div>

            <div className="alerts-container" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {loading && alerts.length === 0 ? (
                    <div className="loading-container">Synchronizing with Edge Nodes...</div>
                ) : alerts.length === 0 ? (
                    <div className="empty-state" style={{ marginTop: '100px', textAlign: 'center' }}>
                        <MdShield size={64} color="var(--accent-emerald)" />
                        <h3 style={{ color: '#fff', marginTop: '16px' }}>Status: Secure</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>No active threats or detections in the current monitoring window.</p>
                    </div>
                ) : (
                    <div className="alert-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {alerts.map((alert, index) => {
                            const style = getAlertStyle(alert.type);
                            return (
                                <div key={index} className="dashboard-card alert-card slide-up" style={{
                                    display: 'flex', gap: '20px', padding: '20px', alignItems: 'center',
                                    borderLeft: style.borderLeft,
                                    background: style.background,
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div className="alert-icon-wrapper">
                                        {style.icon}
                                    </div>
                                    <div className="alert-body" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <h3 style={{ 
                                                textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1.5px',
                                                fontWeight: 800, color: style.borderLeft.split(' ')[2] 
                                            }}>
                                                {alert.type.toUpperCase()}
                                            </h3>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MdAccessTime size={14} /> {alert.time}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                                            {alert.message}
                                        </p>
                                    </div>
                                    {alert.type === 'poaching' && (
                                        <div className="alert-action">
                                            <div style={{ 
                                                width: '12px', height: '12px', background: '#f43f5e', 
                                                borderRadius: '50%', boxShadow: '0 0 10px #f43f5e',
                                                animation: 'pulse 1.5s infinite' 
                                            }}></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default AlertSystem;
