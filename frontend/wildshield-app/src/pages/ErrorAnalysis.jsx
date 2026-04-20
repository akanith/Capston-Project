import { useState, useEffect } from 'react';
import { MdWarning, MdFilterList, MdBugReport, MdTrendingDown, MdArrowForward } from 'react-icons/md';
import { getErrorAnalysis } from '../services/api';

function ErrorAnalysis() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterClass, setFilterClass] = useState('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const result = await getErrorAnalysis();
            setData(result);
        } catch (err) {
            setError('Could not load error analysis. Ensure training has been completed.');
        } finally {
            setLoading(false);
        }
    };

    const s = {
        card: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.9) 0%, rgba(25,20,45,0.9) 100%)',
            border: '1px solid rgba(168,85,247,0.12)', borderRadius: '16px', padding: '22px',
        },
        glowCard: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.95) 0%, rgba(25,20,45,0.95) 100%)',
            border: '1px solid rgba(168,85,247,0.18)', borderRadius: '16px', padding: '22px',
            boxShadow: '0 0 30px rgba(168,85,247,0.05)',
        },
    };

    const actualClasses = data ? [...new Set(data.errors.map(e => e.actual))].sort() : [];
    const filteredErrors = data ? (filterClass === 'all' ? data.errors : data.errors.filter(e => e.actual === filterClass)) : [];

    if (loading) return (
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(244,63,94,0.15)', borderTop: '3px solid #f43f5e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span className="breathe-anim" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Analyzing model errors...</span>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="slide-up" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="pop-in float-anim" style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(244,63,94,0.3)',
                    }}>
                        <MdBugReport style={{ color: '#fff', fontSize: '20px' }} />
                    </div>
                    <div>
                        <h2 className="shimmer-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Error Analysis</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Analyze model misclassifications — understand where and why the model fails</p>
                    </div>
                </div>
            </div>

            {error && <div className="slide-up" style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', color: '#f43f5e', fontSize: '13px', marginBottom: '20px' }}>⚠ {error}</div>}

            {data && (
                <>
                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div className="slide-up anim-delay-1 hover-lift" style={s.glowCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(244,63,94,0.15)' }}>
                                    <MdTrendingDown style={{ color: '#f43f5e', fontSize: '22px' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', animation: 'countUp 0.6s ease forwards', animationDelay: '0.3s' }}>{data.total_errors}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Misclassifications</div>
                                </div>
                            </div>
                        </div>

                        <div className="slide-up anim-delay-2 hover-lift" style={s.glowCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <MdWarning style={{ color: '#f59e0b', fontSize: '22px' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', animation: 'countUp 0.6s ease forwards', animationDelay: '0.4s' }}>{actualClasses.length}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Affected Classes</div>
                                </div>
                            </div>
                        </div>

                        <div className="slide-up anim-delay-3 hover-lift" style={s.glowCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.15)' }}>
                                    <MdFilterList style={{ color: '#3b82f6', fontSize: '22px' }} />
                                </div>
                                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '13px',
                                    fontWeight: 600, flex: 1, cursor: 'pointer',
                                }}>
                                    <option value="all">All Classes ({data.total_errors})</option>
                                    {actualClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Error Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                        {filteredErrors.map((err, i) => (
                            <div key={`${err.actual}-${err.predicted}-${i}`}
                                className={`scale-in hover-glow anim-delay-${Math.min(i + 1, 16)}`}
                                style={{
                                    ...s.card, display: 'flex', gap: '16px', alignItems: 'center',
                                    cursor: 'default', position: 'relative', overflow: 'hidden',
                                }}
                            >
                                {/* Confidence accent strip */}
                                <div className="bar-fill-anim" style={{
                                    position: 'absolute', bottom: 0, left: 0,
                                    width: `${err.confidence}%`, height: '2px',
                                    background: err.confidence > 60 ? 'linear-gradient(90deg, #f43f5e, #e11d48)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                }} />

                                {/* Thumbnail */}
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '12px', flexShrink: 0,
                                    background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {err.image_path ? (
                                        <img src={err.image_path} alt={err.actual} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => { e.target.style.display = 'none'; }} />
                                    ) : null}
                                    <span style={{ fontSize: '22px', display: err.image_path ? 'none' : 'flex' }}>🖼️</span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '13px', fontWeight: 700, color: '#10b981',
                                            padding: '3px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.08)',
                                        }}>{err.actual}</span>
                                        <MdArrowForward style={{ color: 'var(--text-muted)', fontSize: '14px' }} />
                                        <span style={{
                                            fontSize: '13px', fontWeight: 700, color: '#f43f5e',
                                            padding: '3px 10px', borderRadius: '6px', background: 'rgba(244,63,94,0.08)',
                                        }}>{err.predicted}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div className="bar-fill-anim" style={{
                                                width: `${err.confidence}%`, height: '100%',
                                                background: err.confidence > 60 ? 'linear-gradient(90deg, #f43f5e, #e11d48)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                                borderRadius: '3px', animationDelay: `${0.3 + i * 0.05}s`,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, width: '40px', textAlign: 'right' }}>{err.confidence}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredErrors.length === 0 && (
                        <div className="scale-in" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <MdBugReport style={{ fontSize: '40px', opacity: 0.3, marginBottom: '12px' }} />
                            <p>No errors found for this filter.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ErrorAnalysis;
