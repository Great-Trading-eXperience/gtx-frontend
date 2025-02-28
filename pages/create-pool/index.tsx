'use client';

import CreatePoolComponent from "@/components/clob-dex/create-pool/create-pool";


const PoolManagementPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 relative overflow-hidden">
            <CreatePoolComponent />
        </div>
    );
};

export default PoolManagementPage;