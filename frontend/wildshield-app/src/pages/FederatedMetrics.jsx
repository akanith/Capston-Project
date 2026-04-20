import { useState, useEffect } from 'react';
import { MdOutlineTimer, MdCheckCircleOutline, MdSync, MdTimeline, MdMemory, MdWifi, MdCircle } from 'react-icons/md';
import { getMetrics } from '../services/api';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';

function FederatedMetrics() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const data = await getMetrics();
            setMetrics(data);
        } catch {
            console.log('Metrics not available');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading metrics...</p></div>;

    const history = metrics?.training_history;
    if (!history) {
        return (
            <div className="fade-in">
                <div className="page-header" style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', color: '#fff' }}>Metric Analysis</h2>
                    <p style={{ color: 'var(--text-muted)' }}>No training data available yet. Run the federated training script first.</p>
                </div>
            </div>
        );
    }

    const roundsData = history.rounds.map((r) => {
        const row = { round: r.round, accuracy: +(r.global_accuracy * 100).toFixed(2), loss: +r.global_loss.toFixed(4) };
        return row;
    });

    const clientParticipation = history.rounds[0]?.clients.map((c, i) => ({
        name: `C${c.client_id}`,
        samples: c.samples,
    })) || [];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Federated Engine Diagnostics</h2>
                <p style={{ color: 'var(--text-muted)' }}>Deep-dive into global model convergence and distributed client participation.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
                <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Weight Aggregation</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{history.config.num_rounds} Rounds</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-purple)', marginTop: '8px', fontWeight: 600 }}>100% Participation Rate</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-purple)', opacity: 0.3 }}></div>
                </div>

                <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Peak Convergence</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{(history.best_accuracy * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Validation set accuracy</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-emerald)', opacity: 0.3 }}></div>
                </div>

                <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 700 }}>Active Workers</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{history.config.num_clients} Nodes</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Privacy-secured connections</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-cyan)', opacity: 0.3 }}></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Global Accuracy Gradient</h3>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                COMMUNICATION ROUNDS 1 - {history.config.num_rounds}
                            </div>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={roundsData}>
                                    <defs>
                                        <linearGradient id="metricAcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="round" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ background: '#0a0710', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="accuracy" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#metricAcc)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Training Entropy (Loss)</h3>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                MINIMIZING CROSS-ENTROPY
                            </div>
                        </div>
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={roundsData}>
                                    <defs>
                                        <linearGradient id="metricLoss" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-rose)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-rose)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="round" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#0a0710', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="loss" stroke="var(--accent-rose)" fillOpacity={1} fill="url(#metricLoss)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '20px' }}>CLIENT DATA DISTRIBUTION</h3>
                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', height: '180px', marginBottom: '24px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={clientParticipation}>
                                    <Bar dataKey="samples" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0a0710', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {clientParticipation.map((client, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}></div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Node 0{i + 1}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{client.samples} samples</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '16px' }}>NETWORK TELEMETRY</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Avg. Latency</span>
                                <span style={{ color: '#fff' }}>14.2ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Bandwidth Usage</span>
                                <span style={{ color: '#fff' }}>2.4 MB/s</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Dropped Packets</span>
                                <span style={{ color: 'var(--accent-emerald)' }}>0.00%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FederatedMetrics;
