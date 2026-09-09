'use client';

// ==========================================================================
// Confirm Delete Modal — explicit confirmation before deletion
// ==========================================================================

export default function ConfirmDeleteModal({ movie, pending, onCancel, onConfirm }) {
    return (
        <div className="modal-backdrop admin-modal" role="dialog" aria-modal="true" aria-label="Confirm deletion">
            <div className="admin-form-dialog admin-confirm-dialog">
                <h2>Delete movie?</h2>
                <p>
                    You are about to permanently delete <strong>“{movie.title}”</strong>. This action cannot be
                    undone.
                </p>
                <div className="admin-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
                        Cancel
                    </button>
                    <button type="button" className="btn admin-delete-btn" onClick={onConfirm} disabled={pending}>
                        {pending ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}