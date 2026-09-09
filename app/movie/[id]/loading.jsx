// ==========================================================================
// Movie Detail Loading Boundary
// ==========================================================================

export default function Loading() {
    return (
        <main className="detail-page-body" aria-busy="true">
            <div className="detail-hero">
                <div className="detail-backdrop-wrap skeleton-block" style={{ height: '100%' }} />
            </div>
            <section className="detail-body-section">
                <div className="container detail-layout">
                    <div className="detail-poster-col">
                        <div className="detail-poster-card skeleton-block" style={{ height: '450px' }} />
                    </div>
                    <div className="detail-info-col">
                        <div className="skeleton-line" style={{ width: '60%', height: '40px' }} />
                        <div className="skeleton-line" style={{ width: '40%' }} />
                        <div className="skeleton-line" style={{ width: '30%' }} />
                        <div className="skeleton-line" style={{ width: '100%' }} />
                        <div className="skeleton-line" style={{ width: '95%' }} />
                        <div className="skeleton-line" style={{ width: '85%' }} />
                    </div>
                </div>
            </section>
        </main>
    );
}