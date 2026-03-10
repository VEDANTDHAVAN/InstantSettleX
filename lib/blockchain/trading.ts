import { ethers } from 'ethers'
import {
  getSigner,
  getWalletAddress,
  switchToAmoyNetwork,
} from './provider'
import {
  getSettlementContract,
  getINRTokenContract,
  getStockTokenContract,
  INR_TOKEN_ADDRESS,
  STOCK_TOKEN_ADDRESS,
  SETTLEMENT_ADDRESS,
} from './contracts'

export interface TradeExecutionResult {
  tradeId: string
  txHash: string
  status: 'pending' | 'settling' | 'settled'
  settlementTime: number
  timestamp: Date
}

export async function approveTokens(
  tokenType: 'inr' | 'stock',
  amount: string
): Promise<string> {
  try {
    // Ensure we're on Amoy network
    await switchToAmoyNetwork()

    const signer = await getSigner()
    const tokenAddress = tokenType === 'inr' ? INR_TOKEN_ADDRESS : STOCK_TOKEN_ADDRESS

    if (!SETTLEMENT_ADDRESS) {
      throw new Error('Settlement contract address is not configured.')
    }

    const tokenContract = tokenType === 'inr'
      ? getINRTokenContract(signer)
      : getStockTokenContract(signer)

    // Convert amount to token units (assuming 18 decimals)
    const amountInWei = ethers.parseUnits(amount, 18)

    console.log(`[v0] Approving ${tokenType.toUpperCase()} tokens. Amount: ${amount}`)

    // Approve the settlement contract to spend tokens
    const approveTx = await tokenContract.approve(SETTLEMENT_ADDRESS, amountInWei)
    const approveReceipt = await approveTx.wait()

    console.log(`[v0] Approval transaction confirmed: ${approveReceipt?.hash}`)

    return approveReceipt?.hash || approveTx.hash
  } catch (error: any) {
    console.error('[v0] Token approval failed:', error)
    throw new Error(`Token approval failed: ${error.message}`)
  }
}

export async function createTrade(
  seller: string,
  quantity: number,
  pricePerUnit: number,
  tradeType: 'buy' | 'sell'
): Promise<TradeExecutionResult> {
  try {
    // Ensure we're on Amoy network
    await switchToAmoyNetwork()

    const signer = await getSigner()
    const buyer = await getWalletAddress()
    const startTime = Date.now()

    const settlementContract = getSettlementContract(signer)

    // For buy trades, buyer approves INR tokens
    // For sell trades, seller approves stock tokens
    if (tradeType === 'buy') {
      const totalINR = quantity * pricePerUnit
      console.log(`[v0] Creating buy trade. Total INR: ${totalINR}`)
      await approveTokens('inr', totalINR.toString())
    } else {
      console.log(`[v0] Creating sell trade. Quantity: ${quantity}`)
      await approveTokens('stock', quantity.toString())
    }

    // Create the trade on-chain
    const quantityInWei = ethers.parseUnits(quantity.toString(), 18)
    const priceInWei = ethers.parseUnits(pricePerUnit.toString(), 18)

    console.log(`[v0] Executing createTrade. Buyer: ${buyer}, Seller: ${seller}`)

    const createTx = await settlementContract.createTrade(
      buyer,
      seller,
      STOCK_TOKEN_ADDRESS,
      quantityInWei,
      priceInWei
    )

    const createReceipt = await createTx.wait()
    const settlementTime = (Date.now() - startTime) / 1000

    console.log(`[v0] Trade created with tx hash: ${createReceipt?.hash}`)

    return {
      tradeId: createReceipt?.hash || createTx.hash,
      txHash: createReceipt?.hash || createTx.hash,
      status: 'settled',
      settlementTime,
      timestamp: new Date(),
    }
  } catch (error: any) {
    console.error('[v0] Trade creation failed:', error)
    throw new Error(`Trade creation failed: ${error.message}`)
  }
}

export async function settleTrade(tradeId: string): Promise<string> {
  try {
    // Ensure we're on Amoy network
    await switchToAmoyNetwork()

    const signer = await getSigner()
    const settlementContract = getSettlementContract(signer)

    console.log(`[v0] Settling trade: ${tradeId}`)

    const settleTx = await settlementContract.settleTrade(tradeId)
    const settleReceipt = await settleTx.wait()

    console.log(`[v0] Trade settled with tx hash: ${settleReceipt?.hash}`)

    return settleReceipt?.hash || settleTx.hash
  } catch (error: any) {
    console.error('[v0] Trade settlement failed:', error)
    throw new Error(`Trade settlement failed: ${error.message}`)
  }
}

export async function getTokenBalance(tokenType: 'inr' | 'stock'): Promise<string> {
  try {
    const signer = await getSigner()
    const walletAddress = await getWalletAddress()

    const tokenContract = tokenType === 'inr'
      ? getINRTokenContract(signer)
      : getStockTokenContract(signer)

    const balance = await tokenContract.balanceOf(walletAddress)
    return ethers.formatUnits(balance, 18)
  } catch (error: any) {
    console.error('[v0] Failed to fetch balance:', error)
    throw new Error(`Failed to fetch ${tokenType.toUpperCase()} balance: ${error.message}`)
  }
}
