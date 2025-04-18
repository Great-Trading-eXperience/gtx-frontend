import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract, useAccount } from 'wagmi';
import OrderBookABI from '@/abis/gtx/clob/OrderBookABI';
import { HexAddress } from '@/types/general/address';

// Define types
type Side = 0 | 1; // 0 = BUY, 1 = SELL

type CancelOrderParams = {
    side: Side;
    price: bigint;
    orderId: number; // Changed from bigint to number
    orderBookAddress: HexAddress;
};

/**
 * Custom hook for cancelling orders on the OrderBook contract
 */
export const useCancelOrder = () => {
    // Get user account
    const { address } = useAccount();

    // State for cancel parameters
    const [cancelParams, setCancelParams] = useState<CancelOrderParams>();

    // Cancel order simulation
    const {
        data: simulateCancelData,
        isError: isCancelSimulationError,
        isLoading: isCancelSimulationLoading,
        refetch: refetchCancelSimulation,
        error: cancelSimulateError,
    } = useSimulateContract({
        address: cancelParams?.orderBookAddress,
        abi: OrderBookABI,
        functionName: 'cancelOrder',
        args: cancelParams && address ? [
            cancelParams.side,  // uint8 -> number
            cancelParams.price, // uint64 -> bigint
            Number(cancelParams.orderId), // Convert to number for uint48
            address,
        ] : undefined,
    });

    // Cancel order transaction hooks
    const {
        data: cancelOrderHash,
        isPending: isCancelOrderPending,
        writeContract: writeCancelOrder
    } = useWriteContract();

    // Transaction receipt hooks
    const {
        isLoading: isCancelOrderConfirming,
        isSuccess: isCancelOrderConfirmed
    } = useWaitForTransactionReceipt({
        hash: cancelOrderHash,
    });

    // Handler for cancelling orders
    const handleCancelOrder = async (
        orderBookAddress: HexAddress,
        side: Side,
        price: bigint,
        orderId: number  // Changed from bigint to number
    ) => {
        try {
            console.log('============ Cancel Order Parameters ============');
            console.log('Contract Details:');
            console.log(`Address: ${orderBookAddress}`);
            console.log(`Function: cancelOrder`);
            console.log('\nArguments:');
            console.log(`Side: ${side === 0 ? 'BUY' : 'SELL'}`);
            console.log(`Price: ${price}`);
            console.log(`OrderId: ${orderId}`);
            console.log(`User: ${address}`);
            console.log('===============================================');

            setCancelParams({
                orderBookAddress,
                side,
                price,
                orderId
            });
        } catch (error) {
            console.error('Error preparing cancel order:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.');
        }
    };

    // Effect for cancel simulation
    useEffect(() => {
        if (!cancelParams || isCancelSimulationLoading) {
            return;
        }
        refetchCancelSimulation();
    }, [cancelParams, isCancelSimulationLoading]);

    // Effect for executing cancel after successful simulation
    useEffect(() => {
        if (!simulateCancelData || isCancelOrderConfirming) {
            return;
        }
        toast.info('Cancelling order...');
        writeCancelOrder(simulateCancelData.request);
        setCancelParams(undefined);
    }, [simulateCancelData]);

    // Effect for success message
    useEffect(() => {
        if (isCancelOrderConfirmed) {
            toast.success('Order has been cancelled successfully');
        }
    }, [isCancelOrderConfirmed]);

    // Effect for simulation errors
    useEffect(() => {
        if (cancelSimulateError && isCancelSimulationError && !isCancelSimulationLoading) {
            toast.error(`Cancel order simulation failed: ${cancelSimulateError.toString()}`);
            setCancelParams(undefined);
        }
    }, [cancelSimulateError, isCancelSimulationError]);

    return {
        handleCancelOrder,
        isCancelOrderPending,
        isCancelOrderConfirming,
        isCancelOrderConfirmed,
        isCancelSimulationError,
        isCancelSimulationLoading,
        cancelOrderHash,
        cancelSimulateError,
    };
};