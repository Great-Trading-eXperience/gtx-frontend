import { wagmiConfig } from "@/configs/wagmi";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { CuratorVaultABI } from "@/abis/gtx/perpetual/CuratorVaultABI";
import TokenABI from "@/abis/tokens/TokenABI"

// Define types
export type HexAddress = `0x${string}`;
export type DepositParams = {
  vaultAddress: HexAddress;
  depositAmount: bigint;
  includeWntForFees?: boolean;
  wntAmount?: bigint;
};

export const useAssetVaultDeposit = () => {
  const { address } = useAccount();
  const [depositHash, setDepositHash] = useState<HexAddress | undefined>(undefined);

  const {
    mutateAsync: deposit,
    isPending: isDepositPending,
    isError: isDepositError,
    error: depositSimulateError,
  } = useMutation({
    mutationFn: async (params: DepositParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        // Get the vault's asset token
        const assetToken = await readContract(wagmiConfig, {
          address: params.vaultAddress,
          abi: CuratorVaultABI,
          functionName: "asset",
        }) as HexAddress;

        console.log('Vault Asset Token:', assetToken);

        // Check user's balance
        const balance = await readContract(wagmiConfig, {
          address: assetToken,
          abi: TokenABI,
          functionName: "balanceOf",
          args: [address],
        });

        if (!balance) {
          throw new Error('Insufficient balance');
        }

        if ((balance as bigint) < params.depositAmount) {
          throw new Error(`Insufficient balance. You have ${balance.toString()} but trying to deposit ${params.depositAmount.toString()}`);
        }

        // First, approve the token spending
        const approvalHash = await writeContract(wagmiConfig, {
          address: assetToken,
          abi: TokenABI,
          functionName: "approve",
          args: [params.vaultAddress, params.depositAmount],
        });

        toast.info('Approving token transfer...');

        // Wait for approval to complete
        const approvalReceipt = await waitForTransactionReceipt(wagmiConfig, {
          hash: approvalHash,
        });

        if (approvalReceipt.status !== 'success') {
          throw new Error('Token approval failed');
        }

        toast.success('Token approval confirmed');

        // If we need to send WNT for execution fees
        // if (params.includeWntForFees && params.wntAmount) {
        //   // Get the WNT address from environment config or constants
        //   const wntAddress = process.env.WETH_ADDRESS as HexAddress;

        //   // Approve WNT transfer
        //   const wntApprovalHash = await writeContract(wagmiConfig, {
        //     address: wntAddress,
        //     abi: TokenABI,
        //     functionName: "approve",
        //     args: [params.vaultAddress, params.wntAmount],
        //   });

        //   toast.info('Approving WNT transfer for fees...');

        //   // Wait for WNT approval
        //   const wntApprovalReceipt = await waitForTransactionReceipt(wagmiConfig, {
        //     hash: wntApprovalHash, 
        //   });

        //   if (wntApprovalReceipt.status !== 'success') {
        //     throw new Error('WNT approval failed');
        //   }

        //   // Transfer WNT
        //   const wntTransferHash = await writeContract(wagmiConfig, {
        //     address: wntAddress,
        //     abi: erc20Abi,
        //     functionName: "transfer",
        //     args: [params.vaultAddress, params.wntAmount],
        //   });

        //   toast.info('Sending WNT for execution fees...');

        //   // Wait for WNT transfer
        //   const wntTransferReceipt = await waitForTransactionReceipt(wagmiConfig, {
        //     hash: wntTransferHash,
        //   });

        //   if (wntTransferReceipt.status !== 'success') {
        //     throw new Error('WNT transfer failed');
        //   }

        //   toast.success('WNT transfer confirmed');
        // }

        // Finally, perform the deposit
        const hash = await writeContract(wagmiConfig, {
          address: params.vaultAddress,
          abi: CuratorVaultABI,
          functionName: "deposit",
          args: [params.depositAmount],
        });

        console.log('Deposit Hash:', hash);

        setDepositHash(hash);
        toast.success('Deposit submitted. Waiting for confirmation...');

        const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

        if (receipt.status === 'success') {
          toast.success('Deposit confirmed successfully!');
          
          // Get the updated balance for the vault
          const vaultBalance = await readContract(wagmiConfig, {
            address: assetToken,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [params.vaultAddress],
          });

          console.log(`Vault ${params.vaultAddress} balance: ${vaultBalance.toString()}`);
        } else {
          toast.error('Deposit failed on-chain');
          throw new Error('Deposit failed on-chain');
        }

        return receipt;
      } catch (error) {
        console.error('Deposit error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to deposit to vault');
        throw error;
      }
    },
  });

  // Transaction confirmation state
  const {
    data: depositReceipt,
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Helper function to format amounts based on token decimals
  const formatDeposit = (amount: number | string, decimals: number = 6) => {
    return parseUnits(amount.toString(), decimals);
  };

  // Main deposit function with convenient parameters
  const depositToVault = async ({
    vaultAddress,
    amount,
    decimals = 6,
    includeWntForFees = false,
    wntAmount = parseUnits("1", 18), // Default 1 WNT for fees
  }: {
    vaultAddress: HexAddress;
    amount: number | string;
    decimals?: number;
    includeWntForFees?: boolean;
    wntAmount?: string | bigint;
  }) => {
    if (!address) {
      toast.error('Wallet not connected');
      return;
    }

    // Format the amount with appropriate decimals
    const formattedAmount = typeof amount === 'string' || typeof amount === 'number' 
      ? formatDeposit(amount, decimals)
      : amount as bigint;

    // Format WNT amount
    const formattedWntAmount = typeof wntAmount === 'string'
      ? parseUnits(wntAmount, 18)
      : wntAmount as bigint;

    // Validation
    if (formattedAmount <= 0n) {
      toast.error('Deposit amount must be greater than zero');
      return;
    }

    return deposit({
      vaultAddress,
      depositAmount: formattedAmount,
      includeWntForFees,
      wntAmount: formattedWntAmount,
    });
  };

  return {
    depositToVault,
    isDepositPending,
    isDepositConfirming,
    isDepositConfirmed,
    isDepositError,
    depositHash,
    depositSimulateError,
    depositReceipt,
    formatDeposit,
  };
};