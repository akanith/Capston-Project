import { useLocation } from 'react-router-dom';
import { MdSearch, MdNotificationsNone, MdHelpOutline } from 'react-icons/md';

const pageTitles = {
    '/': 'Dashboard',
    '/predict': 'Animal Prediction',
    '/yolo-image': 'YOLO Image Detection',
    '/yolo-video': 'YOLO Video Detection',
    '/webcam': 'Webcam Detection',
    '/metrics': 'Federated Training Metrics',
    '/confusion': 'Confusion Matrix',
    '/comparison': 'Model Comparison',
    '/fedavg': 'FedAvg Explanation',
};

function Header() {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'WildShield-FL';

    return (
        <header className="top-header">
            <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {title}
                {['/', '/metrics', '/predict', '/confusion'].includes(location.pathname) && (
                    <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', padding: '4px 8px', borderRadius: '4px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>LIVE SESSION</span>
                )}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <MdSearch style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search parameters..."
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)', fontSize: '13px', width: '240px',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '20px' }}>
                    <MdNotificationsNone style={{ cursor: 'pointer' }} />
                    <MdHelpOutline style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    JD
                </div>
            </div>
        </header>
    );
}

export default Header;
