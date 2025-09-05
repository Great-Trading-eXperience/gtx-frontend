"use client"

import { type AvatarComponent } from "@rainbow-me/rainbowkit"
import Image from "next/image"
import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

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