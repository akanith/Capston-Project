import { useState, useEffect } from 'react';
import { MdPeople, MdTrendingUp, MdMemory, MdTimeline, MdSignalCellularAlt, MdHub } from 'react-icons/md';
import { getClientData } from '../services/api';

function FederatedClients() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const result = await getClientData();
            setData(result);
        } catch (err) {
            setError('Could not load client data. Ensure training has been completed.');
        } finally {
            setLoading(false);
        }
    };

    const s = {
        card: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.9) 0%, rgba(25,20,45,0.9) 100%)',
            border: '1px solid rgba(168,85,247,0.12)', borderRadius: '16px', padding: '20px',
        },
        glowCard: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.95) 0%, rgba(25,20,45,0.95) 100%)',
            border: '1px solid rgba(168,85,247,0.18)', borderRadius: '16px', padding: '22px',
            boxShadow: '0 0 30px rgba(168,85,247,0.05)',
        },
        label: {
            fontSize: '10px', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase',
            letterSpacing: '1.5px', fontWeight: 700, marginBottom: '14px',
        },
    };

    const clientColors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

    if (loading) return (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(168,85,247,0.15)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span className="breathe-anim" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading client data...</span>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="slide-up" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="pop-in float-anim" style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                    }}>
                        <MdHub style={{ color: '#fff', fontSize: '20px' }} />
                    </div>
                    <div>
                        <h2 className="shimmer-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Federated Clients Monitor</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Visualize the federated learning process across distributed clients</p>
                    </div>
                </div>
            </div>

            {error && <div className="slide-up" style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>⚠ {error}</div>}

            {data && (
                <>
                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: 'Total Clients', value: data.num_clients, icon: <MdPeople />, color: '#a855f7' },
                            { label: 'Total Rounds', value: data.total_rounds, icon: <MdTimeline />, color: '#3b82f6' },
                            { label: 'Final Accuracy', value: `${data.global_accuracy[data.global_accuracy.length - 1] || 0}%`, icon: <MdTrendingUp />, color: '#10b981' },
                            { label: 'Final Loss', value: data.global_loss[data.global_loss.length - 1] || 0, icon: <MdMemory />, color: '#f59e0b' },
                        ].map((stat, i) => (
                            <div key={i} className={`slide-up anim-delay-${i + 1} hover-lift`} style={s.glowCard}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '10px',
                                        background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: stat.color, fontSize: '18px',
                                    }}>{stat.icon}</div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{stat.label}</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-1px', animation: 'countUp 0.6s ease forwards', animationDelay: `${0.3 + i * 0.1}s` }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Client Cards */}
                    <div className="slide-up anim-delay-5" style={s.label}>Client Performance</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.clients.length, 3)}, 1fr)`, gap: '16px', marginBottom: '24px' }}>
                        {data.clients.map((client, ci) => {
                            const color = clientColors[ci % clientColors.length];
                            return (
                                <div key={client.client_id} className={`scale-in anim-delay-${ci + 6} hover-lift`} style={{
                                    ...s.glowCard, position: 'relative', overflow: 'hidden',
                                }}>
                                    <div className="gradient-bg-anim" style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                                        background: `linear-gradient(90deg, ${color}, ${color}80, ${color})`,
                                        backgroundSize: '200% 100%',
                                    }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{client.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{client.total_rounds} rounds</div>
                                        </div>
                                        <div className="pop-in" style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', fontWeight: 800, color: color, border: `1px solid ${color}25`,
                                            animationDelay: `${0.5 + ci * 0.15}s`,
                                        }}>C{client.client_id}</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{
                                            textAlign: 'center', padding: '12px', borderRadius: '10px',
                                            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)',
                                        }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', animation: 'countUp 0.5s ease forwards', animationDelay: `${0.6 + ci * 0.1}s` }}>{client.final_accuracy}%</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Accuracy</div>
                                        </div>
                                        <div style={{
                                            textAlign: 'center', padding: '12px', borderRadius: '10px',
                                            background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)',
                                        }}>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', animation: 'countUp 0.5s ease forwards', animationDelay: `${0.7 + ci * 0.1}s` }}>{client.final_loss}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loss</div>
                                        </div>
                                    </div>

                                    {/* Animated sparkline */}
                                    <div style={{ display: 'flex', gap: '2px', alignItems: 'end', height: '40px' }}>
                                        {client.accuracy_history.map((acc, i) => (
                                            <div key={i} style={{
                                                flex: 1, borderRadius: '3px 3px 0 0',
                                                height: `${Math.max(4, acc / 100 * 40)}px`,
                                                background: `linear-gradient(to top, ${color}30, ${color}${Math.round((0.3 + acc / 100 * 0.7) * 255).toString(16).padStart(2, '0')})`,
                                                animation: `barFill 0.8s cubic-bezier(0.4,0,0.2,1) forwards`,
                                                animationDelay: `${0.8 + i * 0.03}s`,
                                                opacity: 0,
                                                animationFillMode: 'forwards',
                                            }} title={`Round ${i + 1}: ${acc}%`}>
                                                <style>{`
                                                    @keyframes barFillOpacity { from { opacity:0; height:0; } to { opacity:1; } }
                                                `}</style>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Global Chart */}
                    <div className="slide-up anim-delay-10 hover-glow" style={s.glowCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={s.label}>Global Accuracy Over Rounds</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MdSignalCellularAlt style={{ color: '#10b981', fontSize: '16px' }} />
                                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                                    {data.global_accuracy[data.global_accuracy.length - 1] || 0}% final
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'end', height: '140px', padding: '0 4px' }}>
                            {data.global_accuracy.map((acc, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{acc}%</span>
                                    <div style={{
                                        width: '100%', maxWidth: '36px', borderRadius: '6px 6px 0 0',
                                        height: `${Math.max(8, acc / 100 * 110)}px`,
                                        background: `linear-gradient(to top, rgba(168,85,247,0.3), #a855f7)`,
                                        opacity: 0.5 + (acc / 100) * 0.5,
                                        animation: `slideUp 0.5s ease forwards`,
                                        animationDelay: `${0.6 + i * 0.04}s`,
                                        boxShadow: i === data.global_accuracy.length - 1 ? '0 0 12px rgba(168,85,247,0.3)' : 'none',
                                    }} />
                                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>R{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default FederatedClients;
