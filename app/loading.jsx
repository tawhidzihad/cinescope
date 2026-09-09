// ==========================================================================
// Root Loading Boundary — skeleton grid
// ==========================================================================

import { MovieGridSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
    return (
        <main className="container loading-page">
            <div className="section-header">
                <span className="section-subtitle skeleton-line" style={{ width: '140px' }} />
                <h2 className="section-title skeleton-line" style={{ width: '280px' }} />
            </div>
            <MovieGridSkeleton count={12} />
        </main>
    );
}