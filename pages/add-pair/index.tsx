'use client';

import CreatePoolComponent from "@/components/clob-dex/create-pool/create-pool";


const PoolManagementPage = () => {
    return (
        <div className="container h-screen mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Pool Management</h1>
            <CreatePoolComponent />
        </div>
    );
};

export default PoolManagementPage;