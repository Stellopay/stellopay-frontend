"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Network, useNetwork } from "@/context/network-context";
import Image from "next/image";

const NETWORKS: { value: Network; label: string; icon: string }[] = [
  { value: "ethereum", label: "ETH", icon: "/logos/eth.svg" },
  { value: "starknet", label: "Starknet", icon: "/logos/starknet.svg" },
  { value: "polygon", label: "Polygon", icon: "/logos/polygon.svg" },
  { value: "arbitrum", label: "Arbitrum", icon: "/logos/arbitrum.svg" },
  { value: "optimism", label: "Optimism", icon: "/logos/optimism.svg" },
  { value: "stellar", label: "Stellar", icon: "/stellar.png" },
];

export function NetworkSwitcher() {
  const { selectedNetwork, setSelectedNetwork } = useNetwork();

  const currentNetwork = NETWORKS.find((n) => n.value === selectedNetwork);

  const renderIcon = (icon: string, isSelected = false) => {
    return (
      <Image
        src={icon}
        alt=""
        width={isSelected ? 40 : 20}
        height={isSelected ? 40 : 20}
        className={isSelected ? "w-10 h-10" : "w-5 h-5"}
      />
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="text-white outline-0 bg-[#1A0C1D] hover:bg-[#1A0C1D] cursor-pointer flex items-center gap-2">
          {renderIcon(currentNetwork?.icon || "", true)}
          <span className="hidden sm:inline">{currentNetwork?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        {NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network.value}
            onClick={() => setSelectedNetwork(network.value)}
            className="hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-2"
          >
            {renderIcon(network.icon)}
            <span>{network.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
