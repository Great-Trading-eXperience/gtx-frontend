import React, { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import ButtonConnectWallet from '../button-connect-wallet.tsx/button-connect-wallet'
import GradientLoader from '../gradient-loader/gradient-loader'

interface WalletWrapperProps {
    children: React.ReactNode
}

const WalletWrapper: React.FC<WalletWrapperProps> = ({ children }) => {
    const { isConnecting, isConnected } = useAccount()
    const { signMessage, status: signStatus } = useSignMessage()
    const [showLoader, setShowLoader] = useState(false)

    useEffect(() => {
        // Show loader when connecting wallet
        if (isConnecting) {
            setShowLoader(true)
            const timer = setTimeout(() => {
                setShowLoader(false)
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [isConnecting])

    useEffect(() => {
        // Show loader when signing
        if (signStatus === 'pending') {
            setShowLoader(true)
            const timer = setTimeout(() => {
                setShowLoader(false)
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [signStatus])

    if (!isConnected) {
        return <ButtonConnectWallet />
    }

    return (
        <>
            {showLoader && <GradientLoader />}
            {children}
        </>
    )
}

export default WalletWrapper