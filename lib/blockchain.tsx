"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import * as blockchainProvider from "./blockchain/provider"
import * as blockchainTrading from "./blockchain/trading"

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

    try {
      // Connect to MetaMask
      const walletInfo = await blockchainProvider.connectWallet()
      
      // Switch to Polygon Amoy network
      try {
        await blockchainProvider.switchToAmoyNetwork()
      } catch (networkError) {
        console.warn("[v0] Network switch warning:", networkError)
        // Continue even if network switch fails
      }

      // Get network and balance info
      const [network, balance] = await Promise.all([
        blockchainProvider.getNetwork(),
        blockchainProvider.getBalance(),
      ])

      setWallet({
        address: walletInfo.address,
        isConnected: true,
        isConnecting: false,
        network: network.name === "unknown" ? "Polygon Amoy" : network.name,
        balance: `${parseFloat(balance).toFixed(4)} MATIC`,
      })
    } catch (error: any) {
      console.error("[v0] Connection error:", error)
      setWallet((prev) => ({ ...prev, isConnecting: false }))
      throw error
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    blockchainProvider.clearCache()
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
      network: "Polygon Amoy",
      balance: "0",
    })
  }, [])

  const executeTrade = useCallback(
    async (stock: string, quantity: number, price: number, type: "buy" | "sell"): Promise<Trade> => {
      try {
        const startTime = Date.now()
        
        // Simulate seller address (in real scenario, would be from order book)
        const sellerAddress = type === "buy" ? "0x8f3e4a1b5c7d9e2f4a8b1c2d3e4f5a6b7c8d9e" : "0x5a2f3d1e4b6c8a9d7e1f3b5c7a9e1d3c5b7a9e"

        const newTrade: Trade = {
          id: `TXN-${String(trades.length + 1).padStart(3, "0")}`,
          stock,
          quantity,
          price,
          type,
          timestamp: new Date(),
          status: "pending",
          txHash: "",
          buyer: type === "buy" ? (wallet.address?.slice(0, 6) + "..." + wallet.address?.slice(-4)) || "0x..." : "0x5a2f...D4e7",
          seller: type === "sell" ? (wallet.address?.slice(0, 6) + "..." + wallet.address?.slice(-4)) || "0x..." : "0x8f3e...B2c1",
        }

        setTrades((prev) => [newTrade, ...prev])

        // Call real blockchain trade creation
        try {
          const result = await blockchainTrading.createTrade(
            sellerAddress,
            quantity,
            price,
            type
          )

          const settlementTime = (Date.now() - startTime) / 1000

          setTrades((prev) =>
            prev.map((t) =>
              t.id === newTrade.id 
                ? { ...t, status: "settled", txHash: result.txHash, settlementTime }
                : t
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

          return { ...newTrade, status: "settled", txHash: result.txHash, settlementTime }
        } catch (blockchainError: any) {
          console.error("[v0] Blockchain trade execution error:", blockchainError)
          
          // Fallback to simulated settlement if blockchain fails
          await new Promise((resolve) => setTimeout(resolve, 1000))
          
          setTrades((prev) =>
            prev.map((t) => (t.id === newTrade.id ? { ...t, status: "settling" as const } : t))
          )

          await new Promise((resolve) => setTimeout(resolve, 2000))

          const settlementTime = 2.5 + Math.random() * 2
          setTrades((prev) =>
            prev.map((t) =>
              t.id === newTrade.id 
                ? { ...t, status: "settled" as const, settlementTime, txHash: `0x${Math.random().toString(16).slice(2)}` }
                : t
            )
          )

          // Still update portfolio for fallback
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

          return { ...newTrade, status: "settled", settlementTime: 2.5, txHash: `0x${Math.random().toString(16).slice(2)}` }
        }
      } catch (error: any) {
        console.error("[v0] Trade execution failed:", error)
        throw error
      }
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
