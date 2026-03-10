import { ethers } from 'ethers'

// Contract addresses from environment variables
export const SETTLEMENT_ADDRESS = process.env.NEXT_PUBLIC_SETTLEMENT_ADDRESS || ''
export const INR_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_INR_TOKEN_ADDRESS || ''
export const STOCK_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STOCK_TOKEN_ADDRESS || ''

// Minimal ABIs for contract interaction
export const SETTLEMENT_ABI = [
  {
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'stockToken', type: 'address' },
      { name: 'quantity', type: 'uint256' },
      { name: 'pricePerUnit', type: 'uint256' },
    ],
    name: 'createTrade',
    outputs: [{ name: 'tradeId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tradeId', type: 'uint256' }],
    name: 'settleTrade',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tradeId', type: 'uint256' },
    ],
    name: 'getTrade',
    outputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'stockToken', type: 'address' },
      { name: 'quantity', type: 'uint256' },
      { name: 'pricePerUnit', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'settledAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const TOKEN_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export function getSettlementContract(signer: ethers.Signer) {
  if (!SETTLEMENT_ADDRESS) {
    throw new Error('Settlement contract address is not configured. Please set NEXT_PUBLIC_SETTLEMENT_ADDRESS.')
  }
  return new ethers.Contract(SETTLEMENT_ADDRESS, SETTLEMENT_ABI, signer)
}

export function getINRTokenContract(signer: ethers.Signer) {
  if (!INR_TOKEN_ADDRESS) {
    throw new Error('INR token address is not configured. Please set NEXT_PUBLIC_INR_TOKEN_ADDRESS.')
  }
  return new ethers.Contract(INR_TOKEN_ADDRESS, TOKEN_ABI, signer)
}

export function getStockTokenContract(signer: ethers.Signer) {
  if (!STOCK_TOKEN_ADDRESS) {
    throw new Error('Stock token address is not configured. Please set NEXT_PUBLIC_STOCK_TOKEN_ADDRESS.')
  }
  return new ethers.Contract(STOCK_TOKEN_ADDRESS, TOKEN_ABI, signer)
}

export const POLYGONSCAN_BASE_URL = 'https://amoy.polygonscan.com'

export function getTransactionUrl(txHash: string): string {
  return `${POLYGONSCAN_BASE_URL}/tx/${txHash}`
}
