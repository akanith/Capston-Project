import { NavLink, useLocation } from 'react-router-dom';
import {
    MdDashboard, MdImageSearch, MdVideocam, MdCameraAlt,
    MdBarChart, MdGridOn, MdCompareArrows, MdAccountTree, MdPets,
    MdVisibility, MdPeople, MdBugReport, MdPhoto, MdShield,
    MdNotificationsActive, MdMap, MdSettingsInputAntenna, MdPsychology, MdAutoGraph,
    MdOutlineInsights
} from 'react-icons/md';

const navItems = [
    {
        section: 'OVERVIEW',
        items: [
            { path: '/', icon: <MdDashboard />, label: 'Dashboard' },
        ]
    },
    {
        section: 'CORE SYSTEM',
        isPrimary: true,
        items: [
            { path: '/yolo-image', icon: <MdImageSearch />, label: 'YOLO Image Detection' },
            { path: '/yolo-video', icon: <MdVideocam />, label: 'YOLO Video Detection' },
            { path: '/webcam', icon: <MdCameraAlt />, label: 'Webcam Detection' },
        ]
    },
    {
        section: 'INTELLIGENCE LAYER',
        isPrimary: true,
        items: [
            { path: '/predict', icon: <MdAutoGraph />, label: 'FL Prediction' },
            { path: '/alerts', icon: <MdNotificationsActive />, label: 'Alert System' },
            { path: '/map', icon: <MdMap />, label: 'Map View' },
            { path: '/active-learning', icon: <MdPsychology />, label: 'Active Learning' },
        ]
    },
    {
        section: 'PERFORMANCE & ANALYTICS',
        items: [
            { path: '/edge-metrics', icon: <MdSettingsInputAntenna />, label: 'Edge Metrics' },
            { path: '/fl-analytics', icon: <MdOutlineInsights />, label: 'FL Analytics' },
        ]
    },
    {
        section: 'RESEARCH',
        isSecondary: true,
        items: [
            { path: '/metrics', icon: <MdBarChart />, label: 'Training Metrics' },
            { path: '/confusion', icon: <MdGridOn />, label: 'Confusion Matrix' },
            { path: '/gradcam', icon: <MdVisibility />, label: 'Model Explainability' },
        ]
    },
    {
        section: 'ADVANCED',
        isSecondary: true,
        items: [
            { path: '/fedavg', icon: <MdAccountTree />, label: 'FedAvg Explained' },
            { path: '/fed-clients', icon: <MdPeople />, label: 'Federated Clients' },
            { path: '/error-analysis', icon: <MdBugReport />, label: 'Error Analysis' },
            { path: '/dataset', icon: <MdPhoto />, label: 'Dataset Explorer' },
        ]
    },
];

function Sidebar() {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <MdShield />
                </div>
                <div className="brand-text">
                    <h1>WildShield-FL</h1>
                    <p>Federated Node 18</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div 
                        key={section.section} 
                        className={`nav-section ${section.isPrimary ? 'primary-section' : ''} ${section.isSecondary ? 'secondary-section' : ''}`}
                    >
                        <div className="nav-section-label">
                            {section.section}
                            {section.isPrimary && <span className="primary-indicator" />}
                        </div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                                end={item.path === '/'}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <p>WildShield-FL v2.0</p>
                <div className="status-indicator">
                    <span className="dot pulse" />
                    System Active
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
