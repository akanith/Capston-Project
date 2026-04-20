import { useState, useEffect } from 'react';
import { 
    MdPets, MdBarChart, MdStorage, MdTimeline, MdSecurity, 
    MdMemory, MdWifi, MdCircle, MdNotificationsActive, 
    MdVisibility, MdRadar, MdCheckCircle
} from 'react-icons/md';
import { getMetrics } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async () => {
        try {
            const data = await getMetrics();
            setMetrics(data);
        } catch (err) {
            console.log('Metrics not available yet');
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = () => {
        fetch("http://localhost:8000/alerts")
            .then(res => res.json())
            .then(data => setAlerts(data.slice(0, 5)))
            .catch(err => console.error("Dashboard Alert Fetch Fail:", err));
    };

    const history = metrics?.training_history;
    const evaluation = metrics?.evaluation_metrics;

    const roundsData = history?.rounds?.map((r) => ({
        round: r.round,
        accuracy: (r.global_accuracy * 100).toFixed(1),
        loss: r.global_loss.toFixed(3),
    })) || Array.from({ length: 14 }, (_, i) => ({ round: i + 1, accuracy: 65 + i * 2, loss: 0.45 - i * 0.02 }));

    return (
        <div className="fade-in">
            {/* System Status Header */}
            <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid var(--accent-purple)', flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <div className="status-indicator" style={{ whiteSpace: 'nowrap' }}>
                        <span className="dot pulse" style={{ width: '10px', height: '10px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px' }}>SYSTEM LIVE: SECURE MONITORING</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '32px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Nodes</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>18 Edge Devices</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threat Level</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: alerts.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                            {alerts.length > 0 ? 'ALERT DETECTED' : 'SAFE (NO THREATS)'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Strategic Operations Dashboard</h2>
                <p style={{ color: 'var(--text-muted)' }}>WildShield-FL — Federated Neural Monitoring Ecosystem v2.4</p>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Global Accuracy</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>94.2%</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '8px' }}>+2.4% Optimal Growth</div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Inference Rate</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>64ms</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '8px' }}>Stable latency profile</div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Edge FPS</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>24.8</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '8px' }}>Optimized ResNet18</div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Privacy Multiplier</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>100%</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-rose)', marginTop: '8px' }}>Data Localization Active</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Performance Chart */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Decentralized Training Analytics</h3>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
                                    <MdCircle size={8} /> Accuracy
                                </span>
                            </div>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={roundsData}>
                                    <defs>
                                        <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="round" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#0a0710', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Detections Grid */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent System Activity</h3>
                            <MdRadar className="pulse" style={{ color: 'var(--accent-cyan)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {[
                                { species: 'Elephant', time: '2m ago', conf: '94%', type: 'YOLO' },
                                { species: 'Tiger', time: '15m ago', conf: '88%', type: 'FL' },
                                { species: 'Human', time: '1h ago', conf: '99%', type: 'YOLO' }
                            ].map((det, i) => (
                                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{det.type} • {det.time}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{det.species}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>{det.conf} Accuracy</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Alerts Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px', height: '100%', minHeight: '500px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <MdNotificationsActive style={{ color: alerts.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }} />
                           LIVE ALERT STREAM
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {alerts.length > 0 ? (
                                alerts.map((alert, i) => (
                                    <div key={i} style={{ padding: '14px', borderRadius: '12px', background: alert.type === 'poaching' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(168, 85, 247, 0.1)', border: alert.type === 'poaching' ? '1px solid var(--accent-rose)' : '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '10px', color: alert.type === 'poaching' ? 'var(--accent-rose)' : 'var(--accent-purple)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                                            {alert.type}
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#fff', lineHeight: 1.4 }}>{alert.message}</p>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>{alert.time}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.3 }}>
                                    <MdCheckCircle size={40} style={{ marginBottom: '12px', color: 'var(--accent-emerald)' }} />
                                    <p style={{ fontSize: '13px' }}>No critical alerts active</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
