"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  network: string
  balance: string
}

interface Trade {
  id: string
  stock: string
  quantity: number
  price: number
  type: "buy" | "sell"
  timestamp: Date
  status: "pending" | "settling" | "settled"
  txHash: string
  buyer: string
  seller: string
  settlementTime?: number
}

interface Portfolio {
  stock: string
  quantity: number
  avgPrice: number
  currentValue: number
}

interface BlockchainContextType {
  wallet: WalletState
  trades: Trade[]
  portfolio: Portfolio[]
  inrBalance: number
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  executeTrade: (stock: string, quantity: number, price: number, type: "buy" | "sell") => Promise<Trade>
  settleTrade: (tradeId: string) => Promise<void>
}

const BlockchainContext = createContext<BlockchainContextType | null>(null)

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    network: "Ethereum Mainnet",
    balance: "0",
  })

  const [trades, setTrades] = useState<Trade[]>([
    {
      id: "TXN-001",
      stock: "TCS",
      quantity: 100,
      price: 3450.5,
      type: "buy",
      timestamp: new Date(Date.now() - 120000),
      status: "settled",
      txHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
      buyer: "0x742d...F8a9",
      seller: "0x8f3e...B2c1",
      settlementTime: 3.2,
    },
    {
      id: "TXN-002",
      stock: "Reliance",
      quantity: 50,
      price: 2890.75,
      type: "sell",
      timestamp: new Date(Date.now() - 90000),
      status: "settled",
      txHash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
      buyer: "0x5a2f...D4e7",
      seller: "0x742d...F8a9",
      settlementTime: 2.8,
    },
    {
      id: "TXN-003",
      stock: "Infosys",
      quantity: 75,
      price: 1520.25,
      type: "buy",
      timestamp: new Date(Date.now() - 60000),
      status: "settling",
      txHash: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
      buyer: "0x742d...F8a9",
      seller: "0x9d1c...A5f3",
    },
    {
      id: "TXN-004",
      stock: "TCS",
      quantity: 25,
      price: 3455.0,
      type: "buy",
      timestamp: new Date(Date.now() - 30000),
      status: "pending",
      txHash: "0x4d5e6f7890abcdef1234567890abcdef12345678",
      buyer: "0x742d...F8a9",
      seller: "0x2e4b...C8d2",
    },
  ])

  const [portfolio, setPortfolio] = useState<Portfolio[]>([
    { stock: "TCS", quantity: 125, avgPrice: 3425.75, currentValue: 431250 },
    { stock: "Reliance", quantity: 80, avgPrice: 2845.5, currentValue: 231200 },
    { stock: "Infosys", quantity: 150, avgPrice: 1510.25, currentValue: 228000 },
  ])

  const [inrBalance, setInrBalance] = useState(500000)

  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true }))

    // Simulate MetaMask connection
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Check if MetaMask is available
    if (typeof window !== "undefined" && (window as unknown as { ethereum?: unknown }).ethereum) {
      try {
        const ethereum = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum
        const accounts = await ethereum.request({ method: "eth_requestAccounts" })
        const address = accounts[0]

        setWallet({
          address,
          isConnected: true,
          isConnecting: false,
          network: "Ethereum Mainnet",
          balance: "2.45 ETH",
        })
      } catch {
        // Fallback to mock address if user denies
        setWallet({
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595F8a9",
          isConnected: true,
          isConnecting: false,
          network: "Ethereum Mainnet",
          balance: "2.45 ETH",
        })
      }
    } else {
      // Mock connection for demo
      setWallet({
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595F8a9",
        isConnected: true,
        isConnecting: false,
        network: "Ethereum Mainnet",
        balance: "2.45 ETH",
      })
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
      network: "Ethereum Mainnet",
      balance: "0",
    })
  }, [])

  const executeTrade = useCallback(
    async (stock: string, quantity: number, price: number, type: "buy" | "sell"): Promise<Trade> => {
      const newTrade: Trade = {
        id: `TXN-${String(trades.length + 1).padStart(3, "0")}`,
        stock,
        quantity,
        price,
        type,
        timestamp: new Date(),
        status: "pending",
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        buyer: type === "buy" ? (wallet.address?.slice(0, 6) + "..." + wallet.address?.slice(-4)) : "0x5a2f...D4e7",
        seller: type === "sell" ? (wallet.address?.slice(0, 6) + "..." + wallet.address?.slice(-4)) : "0x8f3e...B2c1",
      }

      setTrades((prev) => [newTrade, ...prev])

      // Simulate blockchain settlement
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setTrades((prev) =>
        prev.map((t) => (t.id === newTrade.id ? { ...t, status: "settling" as const } : t))
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const settlementTime = 2.5 + Math.random() * 2
      setTrades((prev) =>
        prev.map((t) =>
          t.id === newTrade.id ? { ...t, status: "settled" as const, settlementTime } : t
        )
      )

      // Update portfolio
      if (type === "buy") {
        setPortfolio((prev) => {
          const existing = prev.find((p) => p.stock === stock)
          if (existing) {
            return prev.map((p) =>
              p.stock === stock
                ? {
                    ...p,
                    quantity: p.quantity + quantity,
                    avgPrice: (p.avgPrice * p.quantity + price * quantity) / (p.quantity + quantity),
                    currentValue: (p.quantity + quantity) * price,
                  }
                : p
            )
          }
          return [...prev, { stock, quantity, avgPrice: price, currentValue: quantity * price }]
        })
        setInrBalance((prev) => prev - quantity * price)
      } else {
        setPortfolio((prev) =>
          prev.map((p) =>
            p.stock === stock
              ? {
                  ...p,
                  quantity: p.quantity - quantity,
                  currentValue: (p.quantity - quantity) * price,
                }
              : p
          )
        )
        setInrBalance((prev) => prev + quantity * price)
      }

      return { ...newTrade, status: "settled", settlementTime }
    },
    [trades.length, wallet.address]
  )

  const settleTrade = useCallback(async (tradeId: string) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, status: "settling" as const } : t))
    )

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const settlementTime = 2.5 + Math.random() * 2
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId ? { ...t, status: "settled" as const, settlementTime } : t
      )
    )
  }, [])

  return (
    <BlockchainContext.Provider
      value={{
        wallet,
        trades,
        portfolio,
        inrBalance,
        connectWallet,
        disconnectWallet,
        executeTrade,
        settleTrade,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

export function useBlockchain() {
  const context = useContext(BlockchainContext)
  if (!context) {
    throw new Error("useBlockchain must be used within a BlockchainProvider")
  }
  return context
}
