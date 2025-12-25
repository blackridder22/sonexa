import { useState, useEffect } from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileCount: number;
    hasCloudFiles: boolean;  // Cloud-only files selected
    hasLocalFiles: boolean;  // Local files selected
    hasLocalWithCloud: boolean; // Local files that also have cloud copies
    onDelete: (options: { deleteLocal: boolean; deleteCloud: boolean }) => void;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    fileCount,
    hasCloudFiles,
    hasLocalFiles,
    hasLocalWithCloud,
    onDelete
}: DeleteConfirmModalProps) {
    const [deleteLocal, setDeleteLocal] = useState(true);
    const [deleteCloud, setDeleteCloud] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDeleteLocal(hasLocalFiles);
            setDeleteCloud(hasCloudFiles || hasLocalWithCloud);
        }
    }, [isOpen, hasLocalFiles, hasCloudFiles, hasLocalWithCloud]);

    if (!isOpen) return null;

    const handleDelete = async () => {
        // Determine what to delete based on what's selected
        const shouldDeleteLocal = hasLocalFiles && deleteLocal;
        const shouldDeleteCloud = (hasCloudFiles && deleteCloud) || (hasLocalWithCloud && deleteCloud);

        if (!shouldDeleteLocal && !shouldDeleteCloud) return;

        setIsDeleting(true);
        await onDelete({
            deleteLocal: shouldDeleteLocal,
            deleteCloud: shouldDeleteCloud
        });
        setIsDeleting(false);
        onClose();
    };

    // Show options only if we have local files with cloud copies
    const showOptions = hasLocalWithCloud || (hasLocalFiles && hasCloudFiles);

    // Determine what message to show
    const getDescription = () => {
        if (hasCloudFiles && !hasLocalFiles) {
            return 'This will permanently delete the selected files from the cloud.';
        }
        if (hasLocalFiles && !hasCloudFiles && !hasLocalWithCloud) {
            return 'This will permanently delete the selected files from your device.';
        }
        if (hasLocalWithCloud) {
            return 'Some files exist both locally and in the cloud. Choose what to delete:';
        }
        return 'Choose what to delete:';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-sonexa-surface border border-sonexa-border rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-sonexa-border">
                    <h2 className="text-lg font-semibold text-white">Delete {fileCount} file{fileCount > 1 ? 's' : ''}?</h2>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-gray-400">{getDescription()}</p>

                    {showOptions && (
                        <div className="space-y-3">
                            {/* Local option - only show if has local files */}
                            {hasLocalFiles && (
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-sonexa-dark/50 cursor-pointer hover:bg-sonexa-dark transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={deleteLocal}
                                        onChange={(e) => setDeleteLocal(e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-gray-600 bg-transparent accent-sonexa-primary"
                                    />
                                    <div>
                                        <p className="font-medium text-white">Local files</p>
                                        <p className="text-xs text-gray-500">Remove from this device</p>
                                    </div>
                                </label>
                            )}

                            {/* Cloud option - only show if has cloud files or local files with cloud copies */}
                            {(hasCloudFiles || hasLocalWithCloud) && (
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-sonexa-dark/50 cursor-pointer hover:bg-sonexa-dark transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={deleteCloud}
                                        onChange={(e) => setDeleteCloud(e.target.checked)}
                                        className="w-5 h-5 rounded border-2 border-gray-600 bg-transparent accent-cyan-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <p className="font-medium text-white">Cloud files</p>
                                            <p className="text-xs text-gray-500">Remove from Supabase storage</p>
                                        </div>
                                        <img src="./icons/cloud.png" alt="" className="w-5 h-5 opacity-50" />
                                    </div>
                                </label>
                            )}
                        </div>
                    )}

                    <p className="text-sm text-red-400/80">
                        ⚠️ This action cannot be undone.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-sonexa-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || (!deleteLocal && !deleteCloud)}
                        className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
