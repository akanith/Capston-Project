import { useState, useRef } from 'react';
import { MdCloudUpload, MdVisibility, MdBolt, MdInfoOutline, MdAutoAwesome, MdRestartAlt } from 'react-icons/md';
import { getGradCAM } from '../services/api';

function GradCAM() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setResult(null);
            setError(null);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(f);
        }
    };

    const handleExplain = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getGradCAM(file);
            console.log('GradCAM API response keys:', Object.keys(data));
            console.log('heatmap_overlay present:', !!data.heatmap_overlay);
            console.log('heatmap_overlay length:', data.heatmap_overlay?.length || 0);
            console.log('original_image length:', data.original_image?.length || 0);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Grad-CAM analysis failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const s = {
        card: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.9) 0%, rgba(25,20,45,0.9) 100%)',
            border: '1px solid rgba(168,85,247,0.12)',
            borderRadius: '16px', padding: '24px', backdropFilter: 'blur(12px)',
        },
        glowCard: {
            background: 'linear-gradient(135deg, rgba(15,12,28,0.95) 0%, rgba(25,20,45,0.95) 100%)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '16px', padding: '24px', boxShadow: '0 0 30px rgba(168,85,247,0.06)',
        },
        label: {
            fontSize: '10px', color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase',
            letterSpacing: '1.5px', fontWeight: 700, marginBottom: '14px',
        },
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="slide-up" style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div className="pop-in float-anim" style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                    }}>
                        <MdAutoAwesome style={{ color: '#fff', fontSize: '20px' }} />
                    </div>
                    <div>
                        <h2 className="shimmer-text" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                            Model Explainability
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Grad-CAM visualization — see which image regions drove the prediction
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="slide-up" style={{ padding: '14px 18px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', color: '#f43f5e', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⚠</span> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', overflow: 'hidden' }}>
                {/* Left: Upload + Heatmap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                    {!result && (
                        <div className="scale-in anim-delay-2 hover-glow"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                ...s.card, textAlign: 'center', border: '1px dashed rgba(168,85,247,0.35)',
                                cursor: 'pointer', padding: '60px 24px', position: 'relative', overflow: 'hidden',
                                transition: 'all 0.3s ease', minHeight: '380px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '200px', height: '200px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
                            }} />

                            {preview ? (
                                <img src={preview} alt="Preview" className="scale-in" style={{
                                    maxWidth: '100%', maxHeight: '260px', borderRadius: '12px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)', objectFit: 'contain',
                                }} />
                            ) : (
                                <>
                                    <div className="float-anim" style={{
                                        width: '72px', height: '72px', borderRadius: '20px',
                                        background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.1))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                                    }}>
                                        <MdCloudUpload style={{ fontSize: '32px', color: 'rgba(168,85,247,0.5)' }} />
                                    </div>
                                    <h3 style={{ fontSize: '16px', color: '#fff', fontWeight: 700, marginBottom: '6px' }}>Upload Wildlife Image</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPG, PNG or WEBP — up to 10MB</p>
                                </>
                            )}

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

                            {file && !loading && (
                                <button onClick={(e) => { e.stopPropagation(); handleExplain(); }} className="pop-in hover-lift" style={{
                                    marginTop: '20px', padding: '12px 32px',
                                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                                    color: '#fff', border: 'none', borderRadius: '10px',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <MdVisibility size={16} /> Generate Explanation
                                </button>
                            )}
                            {loading && (
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', border: '3px solid rgba(168,85,247,0.15)',
                                        borderTop: '3px solid #a855f7', borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                    <span className="breathe-anim" style={{ color: '#a855f7', fontSize: '13px', fontWeight: 600 }}>Generating Grad-CAM...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {result && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Results Header */}
                            <div className="slide-up anim-delay-1" style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Analysis Results</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>The model focused on the regions highlighted in red.</p>
                                </div>
                                <button onClick={() => { setResult(null); setFile(null); setPreview(null); }} style={{
                                    padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                                }}>
                                    <MdRestartAlt size={14} style={{ marginRight: '4px' }} /> Analyze New Image
                                </button>
                            </div>

                            {/* Images Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', minWidth: 0 }}>
                                <div className="slide-up anim-delay-2" style={{ ...s.glowCard, minWidth: 0 }}>
                                    <div style={s.label}>Original Detection</div>
                                    <img src={`data:image/jpeg;base64,${result.original_image}`} alt="Original"
                                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }} />
                                </div>

                                <div className="slide-up anim-delay-3" style={{ 
                                    ...s.glowCard, 
                                    minWidth: 0, 
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    boxShadow: '0 0 40px rgba(168,85,247,0.1)'
                                }}>
                                    <div style={{ ...s.label, color: '#a855f7' }}>Model Activation Map (Heatmap)</div>
                                    {result.heatmap_overlay ? (
                                        <img src={`data:image/jpeg;base64,${result.heatmap_overlay}`} alt="Explainability"
                                            style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 32px rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.2)' }} />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontSize: '14px' }}>
                                            [ Heatmap Generation Error ]
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Info Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="slide-up anim-delay-2 hover-glow" style={s.glowCard}>
                        <div style={s.label}>Prediction</div>
                        {result ? (
                            <div style={{ textAlign: 'center' }}>
                                <div className="pop-in" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>{result.prediction.class}</div>
                                <div className="scale-in anim-delay-3" style={{
                                    display: 'inline-block', padding: '6px 18px', borderRadius: '100px',
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                    fontSize: '16px', fontWeight: 700, color: '#10b981',
                                }}>{result.prediction.confidence}%</div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Upload an image to see prediction</p>
                        )}
                    </div>

                    <div className="slide-up anim-delay-4 hover-glow" style={s.card}>
                        <div style={s.label}>Model Focus Region</div>
                        <div className={result ? 'pop-in' : ''} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 16px', borderRadius: '10px',
                            background: result ? 'rgba(245,158,11,0.06)' : 'transparent',
                            border: result ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
                        }}>
                            <MdBolt style={{ color: '#f59e0b', fontSize: '22px' }} />
                            <span style={{ fontSize: '15px', color: '#fff', fontWeight: 700 }}>
                                {result ? result.focus_region.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—'}
                            </span>
                        </div>
                    </div>

                    <div className="slide-up anim-delay-6 hover-glow" style={s.card}>
                        <div style={s.label}>Top Predictions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {result ? result.top_predictions.map((p, i) => (
                                <div key={i} className={`slide-left anim-delay-${i + 1}`} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '8px 12px', borderRadius: '8px',
                                    background: i === 0 ? 'rgba(168,85,247,0.06)' : 'transparent',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '22px', height: '22px', borderRadius: '6px',
                                            background: i === 0 ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: 800, color: i === 0 ? '#fff' : 'var(--text-muted)',
                                        }}>{i + 1}</span>
                                        <span style={{ fontSize: '13px', color: '#fff', fontWeight: i === 0 ? 700 : 500 }}>{p.class}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '50px', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div className="bar-fill-anim" style={{
                                                width: `${p.confidence}%`, height: '100%', borderRadius: '3px',
                                                background: i === 0 ? 'linear-gradient(90deg, #a855f7, #6366f1)' : 'rgba(168,85,247,0.3)',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, width: '44px', textAlign: 'right' }}>{p.confidence}%</span>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No predictions yet</p>
                            )}
                        </div>
                    </div>

                    <div className="slide-up anim-delay-8 hover-glow" style={{
                        ...s.card,
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.04), rgba(99,102,241,0.04))',
                        border: '1px solid rgba(168,85,247,0.12)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <MdInfoOutline style={{ color: '#a855f7', fontSize: '16px' }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7', letterSpacing: '0.5px' }}>HOW GRAD-CAM WORKS</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                            Grad-CAM uses gradients flowing into the last convolutional layer (layer4) to produce a heatmap
                            highlighting important regions. <span style={{ color: '#f43f5e' }}>Red areas</span> indicate
                            high importance, while <span style={{ color: '#3b82f6' }}>blue areas</span> contributed little.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GradCAM;
