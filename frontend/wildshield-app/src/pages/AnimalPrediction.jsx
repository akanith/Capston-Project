import { useState, useRef } from 'react';
import { MdCloudUpload, MdPets, MdCameraAlt } from 'react-icons/md';
import { predictImage } from '../services/api';

function AnimalPrediction() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
            setError(null);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handlePredict = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await predictImage(file);
            setResult(data.prediction);
        } catch (err) {
            setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type.startsWith('image/')) {
            setFile(droppedFile);
            setResult(null);
            setError(null);
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target.result);
            reader.readAsDataURL(droppedFile);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Animal Classification</h2>
                <p style={{ color: 'var(--text-muted)' }}>Upload a wildlife image to classify using the federated ResNet18 model.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div
                        className="glass-card"
                        style={{
                            padding: (!file || result) ? '40px 24px' : '24px',
                            border: '1px dashed rgba(168, 85, 247, 0.4)',
                            textAlign: 'center',
                            background: 'rgba(10, 7, 16, 0.6)',
                            transition: 'all 0.3s',
                            display: (!file || (!loading && !result)) ? 'block' : 'none'
                        }}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <MdCloudUpload style={{ fontSize: '24px' }} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                            {file ? 'Selected: ' + file.name : 'Upload Source Image'}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Drag and drop your JPG, PNG, or WEBP file here</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Select Image
                            </button>
                            {file && (
                                <button onClick={handlePredict} disabled={loading} style={{ padding: '8px 24px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)', opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'Analyzing...' : 'Start Classification'}
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '14px 20px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', fontSize: '14px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {(preview || loading || result) && (
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>RESONET18 ANALYSIS</h4>
                                {loading && <div className="spinner" style={{ width: '16px', height: '16px' }}></div>}
                            </div>
                            <div style={{ background: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                                {preview && (
                                    <img src={preview} alt="Uploaded" style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }} />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '20px' }}>PREDICTION RESULTS</h3>

                        {result ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MdPets size={24} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Top Match</div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{result.predicted_class}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{result.confidence}% Confidence</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Alternative Matches</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {result.top_predictions?.slice(1, 4).map((pred, i) => (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                                                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{pred.class}</span>
                                                    <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{pred.confidence}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                                    <div style={{ width: `${pred.confidence}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '2px' }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', opacity: 0.5 }}>
                                <MdCameraAlt style={{ fontSize: '32px', color: 'var(--text-muted)', marginBottom: '12px' }} />
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    {loading ? 'Analyzing image...' : 'Upload an image to see results'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnimalPrediction;
