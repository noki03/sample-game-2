export const styles = {
    panel: {
        position: 'fixed', bottom: 0, left: 0, width: '100%', height: '180px',
        backgroundColor: '#151515', borderTop: '3px solid #00ff00',
        display: 'flex', padding: '20px', color: '#fff', zIndex: 1000,
        boxSizing: 'border-box', overflow: 'visible'
    },
    notificationOverlay: {
        position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#ff0000', color: '#fff', padding: '10px 25px',
        fontWeight: 'bold', fontSize: '14px', borderRadius: '4px',
        boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)', whiteSpace: 'nowrap', zIndex: 1001
    },
    contextLabel: {
        position: 'absolute', top: '-28px', left: '20px', background: '#00ff00',
        color: '#000', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px',
        borderRadius: '4px 4px 0 0', textTransform: 'uppercase'
    },
    resourceSection: {
        width: '180px', borderRight: '2px solid #333',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
    },
    buttonArea: { flex: 1, paddingLeft: '30px', display: 'flex', gap: '40px' },
    menuGroup: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignContent: 'flex-start' },
    managementGroup: { display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid #333', paddingLeft: '20px' },
    label: { width: '100%', fontSize: '10px', fontWeight: 'bold', color: '#00ff00', marginBottom: '5px', opacity: 0.8 },
    btn: {
        position: 'relative', background: '#2a2a2a', color: '#eee', border: '1px solid #555',
        padding: '12px 15px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
        minWidth: '130px', transition: '0.1s', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    progressWipe: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 1, pointerEvents: 'none'
    },
    cancelBadge: {
        position: 'absolute', top: '-8px', right: '-8px', background: '#ff4444',
        color: '#fff', width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', zIndex: 10,
        boxShadow: '0 0 5px rgba(0,0,0,0.5)', border: '1px solid #fff'
    }
};