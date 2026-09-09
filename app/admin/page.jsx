// ==========================================================================
// Admin — page wrapper
// ==========================================================================
// The dashboard is genuinely interactive (forms, modals, file import), so
// the body is a client component; this page stays a thin server wrapper.

import { ToastProvider } from '@/components/ui/Toast';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
    title: 'Admin Dashboard',
    robots: { index: false, follow: false }
};

export default function AdminPage() {
    return (
        <ToastProvider>
            <AdminDashboard />
        </ToastProvider>
    );
}