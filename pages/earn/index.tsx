'use client';

import { QueryClient } from "@tanstack/react-query";
import LiquidbookEarn from "@/components/earn/earn";

const queryClient = new QueryClient();

const Earn = () => {
    return (

        <div>
            <LiquidbookEarn />
        </div>
    );
};

export default Earn;