// ==========================================================================
// Empty State — server component (migrated from empty-state.js)
// ==========================================================================

export default function EmptyState({ title = 'Nothing here yet', description = '', children }) {
    return (
        <div className="empty-state">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16v16H4z" />
                <line x1="4" y1="9" x2="20" y2="9" />
                <line x1="10" y1="9" x2="10" y2="20" />
            </svg>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {children}
        </div>
    );
}