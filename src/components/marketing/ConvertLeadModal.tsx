import { X } from 'lucide-react';
import CreateProjectForm from '../projects/CreateProjectForm';

interface ConvertLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    companyName: string;
    onSuccess?: () => void;
}

export default function ConvertLeadModal({ isOpen, onClose, leadId, companyName, onSuccess }: ConvertLeadModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Convert Lead to Project
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Creating a new project for {companyName}. This will link the project to this lead for revenue tracking.
                            </p>
                        </div>

                        <CreateProjectForm
                            initialClientName={companyName}
                            initialLeadId={leadId}
                            onSuccess={() => {
                                if (onSuccess) onSuccess();
                                onClose();
                            }}
                            onCancel={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
