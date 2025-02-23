"use client"

import Image from "next/image"
import { type AvatarComponent, ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "../ui/button"
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"
import { Wallet } from "lucide-react"

const ChainIcon = ({
  iconUrl,
  name,
  background,
  size = 20,
}: {
  iconUrl?: string
  name?: string
  background?: string
  size?: number
}) => (
  <div
    style={{
      background,
      width: size,
      height: size,
      borderRadius: 999,
      overflow: "hidden",
      marginRight: 4,
    }}
  >
    {iconUrl && (
      <Image
        alt={`${name ?? "Chain"} icon`}
        src={iconUrl || "/placeholder.svg"}
        style={{ width: size, height: size }}
        width={size}
        height={size}
      />
    )}
  </div>
)

export const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return ensImage ? (
    <Image
      src={ensImage || "/placeholder.svg"}
      width={size}
      height={size}
      style={{ borderRadius: size }}
      alt="ENS image"
    />
  ) : (
    <Jazzicon diameter={size} seed={jsNumberForAddress(address)} />
  )
}

export const ButtonConnectWallet = () => {
  return <ConnectButtonWalletComponents />
}

export const ConnectButtonWalletComponents = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) {
          return (
            <div
              aria-hidden="true"
              style={{
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          )
        }

        const connected = account && chain

        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all rounded-lg text-sm sm:text-xs font-bold"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )
        }

        if (chain?.unsupported) {
          return (
            <Button onClick={openChainModal} variant="destructive" className="text-sm sm:text-xs font-bold rounded-lg">
              Wrong network
            </Button>
          )
        }

        return (
          <div className="w-fit flex-col sm:flex-row flex gap-2 z-50">
            <Button
              onClick={openChainModal}
              variant="outline"
              className="text-sm sm:text-xs font-bold rounded-xl max-w-40 bg-slate-900/50 border-cyan-500/10 hover:border-cyan-500/20 hover:bg-slate-900/70 transition-all"
            >
              {chain.hasIcon && (
                <ChainIcon iconUrl={chain.iconUrl} name={chain.name} background={chain.iconBackground} />
              )}
              <span className="max-w-24 truncate">{chain.name}</span>
            </Button>

            <Button
              onClick={openAccountModal}
              variant="outline"
              className="text-sm sm:text-xs font-bold rounded-xl bg-slate-900/50 border-cyan-500/10 hover:border-cyan-500/20 hover:bg-slate-900/70 transition-all"
            >
              {CustomAvatar && <CustomAvatar address={account.address} ensImage={account.ensAvatar} size={18} />}
              <span className="mx-2">{account.displayName}</span>
              {account.displayBalance ? ` (${account.displayBalance})` : ""}
            </Button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

