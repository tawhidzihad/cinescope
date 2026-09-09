// ==========================================================================
// Movies Loading Boundary
// ==========================================================================

import { MovieGridSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
    return (
        <main className="container movies-section">
            <div className="section-header">
                <span className="section-subtitle skeleton-line" style={{ width: '140px' }} />
                <h1 className="section-title skeleton-line" style={{ width: '280px' }} />
            </div>
            <div className="discovery-toolbar skeleton-line" style={{ height: '48px' }} />
            <MovieGridSkeleton count={12} />
        </main>
    );
}