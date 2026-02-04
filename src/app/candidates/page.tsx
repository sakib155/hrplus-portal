'use client';

import GlobalCandidateList from '@/components/candidates/GlobalCandidateList';

export default function CandidatesPage() {
    return (
        <div className="space-y-6">
            <div className="px-4 sm:px-0">
                <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
                <p className="text-gray-500">Manage all candidates across projects.</p>
            </div>
            <GlobalCandidateList />
        </div>
    );
}
