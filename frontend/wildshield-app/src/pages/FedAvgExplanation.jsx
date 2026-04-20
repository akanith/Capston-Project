import { MdSecurity, MdDevices, MdCloudUpload, MdMergeType, MdCheckCircleOutline, MdOutlineMemory, MdVpnKey, MdHub } from 'react-icons/md';

function FedAvgExplanation() {
    const nodes = [
        { id: 'Alpha', status: 'Online', latency: '24ms', uptime: '99.9%', loss: '0.142' },
        { id: 'Beta', status: 'Online', latency: '31ms', uptime: '99.8%', loss: '0.158' },
        { id: 'Gamma', status: 'Online', latency: '18ms', uptime: '100%', loss: '0.131' }
    ];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '22px', borderRight: '1px solid var(--border-color)', paddingRight: '16px', marginRight: '16px' }}>Federated Architecture</h2>
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--accent-emerald)', borderRadius: '50%' }}></span> SYSTEM CHECK OK
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Architecture Diagram Card */}
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Topology Overview</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Real-time visualization of the federated learning network</p>
                        </div>

                        <div style={{ flex: 1, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
                            {/* SVG connections */}
                            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                                <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                                <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                                <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="4 4" />

                                <circle cx="50%" cy="50%" r="60" fill="transparent" stroke="rgba(168, 85, 247, 0.1)" strokeWidth="1" />
                                <circle cx="50%" cy="50%" r="90" fill="transparent" stroke="rgba(168, 85, 247, 0.05)" strokeWidth="1" />
                            </svg>

                            {/* Central Server */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)', border: '2px solid rgba(255,255,255,0.1)' }}>
                                    <MdHub style={{ fontSize: '40px', color: '#fff' }} />
                                </div>
                                <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.3)', letterSpacing: '1px' }}>
                                    AGGREGATION SERVER
                                </div>
                            </div>

                            {/* Node 1 */}
                            <div style={{ position: 'absolute', top: '25%', left: '25%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MdDevices style={{ fontSize: '24px', color: 'var(--accent-emerald)' }} />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>NODE ALPHA</div>
                            </div>

                            {/* Node 2 */}
                            <div style={{ position: 'absolute', top: '25%', left: '75%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MdDevices style={{ fontSize: '24px', color: 'var(--accent-cyan)' }} />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>NODE BETA</div>
                            </div>

                            {/* Node 3 */}
                            <div style={{ position: 'absolute', top: '80%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MdDevices style={{ fontSize: '24px', color: 'var(--accent-rose)' }} />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>NODE GAMMA</div>
                            </div>
                        </div>
                    </div>

                    {/* Node Details List */}
                    <div className="glass-card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Training Node Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {nodes.map(node => (
                                <div key={node.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>Node {node.id}</div>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }}></div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{node.status}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Latency</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{node.latency}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Uptime</span>
                                            <span style={{ color: 'var(--accent-emerald)' }}>{node.uptime}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Curr. Loss</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{node.loss}</span>
                                        </div>
                                    </div>
                                    <button style={{ width: '100%', marginTop: '16px', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        View Logs
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Security Verification */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                                <MdSecurity />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Security Verification</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MdCheckCircleOutline style={{ color: 'var(--accent-emerald)', fontSize: '18px', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' }}>End-to-End Encryption</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>TLS 1.3 secures all weight transfers between nodes and server.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MdCheckCircleOutline style={{ color: 'var(--accent-emerald)', fontSize: '18px', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' }}>Data Localization</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Zero raw data transmission. Datasets remain strictly on edge devices.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <MdCheckCircleOutline style={{ color: 'var(--accent-emerald)', fontSize: '18px', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' }}>Weight Verification</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Cryptographic hashing prevents parameter tampering during transit.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="glass-card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Server Resource Usage</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>CPU Utilization</span>
                                    <span style={{ color: 'var(--accent-purple)' }}>42%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ width: '42%', height: '100%', background: 'var(--accent-purple)', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>RAM Allocation</span>
                                    <span style={{ color: 'var(--accent-cyan)' }}>6.8 GB</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ width: '68%', height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Network Bandwidth</span>
                                    <span style={{ color: 'var(--accent-emerald)' }}>1.2 MB/s</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ width: '12%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '3px' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Mathematical Foundation</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                            The server performs synchronous aggregation using the FedAvg algorithm:
                        </p>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <code style={{ color: 'var(--accent-violet)', fontSize: '13px' }}>w_global = (1/n) × Σ w_client_i</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FedAvgExplanation;
