import { ethers } from 'ethers'

export interface WalletInfo {
  address: string
  signer: ethers.Signer
  provider: ethers.BrowserProvider
}

let cachedProvider: ethers.BrowserProvider | null = null
let cachedSigner: ethers.Signer | null = null

export async function connectWallet(): Promise<WalletInfo> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined. This function must run in the browser.')
  }

  const ethereum = (window as any).ethereum
  if (!ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.')
  }

  try {
    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your MetaMask wallet.')
    }

    const address = accounts[0]

    // Create provider and signer
    const provider = new ethers.BrowserProvider(ethereum)
    const signer = await provider.getSigner()

    cachedProvider = provider
    cachedSigner = signer

    return {
      address,
      signer,
      provider,
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('You rejected the connection request.')
    }
    throw new Error(`Failed to connect wallet: ${error.message}`)
  }
}

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (cachedProvider) {
    return cachedProvider
  }

  if (typeof window === 'undefined') {
    throw new Error('Window is not defined. This function must run in the browser.')
  }

  const ethereum = (window as any).ethereum
  if (!ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  const provider = new ethers.BrowserProvider(ethereum)
  cachedProvider = provider
  return provider
}

export async function getSigner(): Promise<ethers.Signer> {
  if (cachedSigner) {
    return cachedSigner
  }

  const provider = await getProvider()
  const signer = await provider.getSigner()
  cachedSigner = signer
  return signer
}

export async function getWalletAddress(): Promise<string> {
  const signer = await getSigner()
  const address = await signer.getAddress()
  return address
}

export async function getBalance(): Promise<string> {
  const provider = await getProvider()
  const signer = await getSigner()
  const address = await signer.getAddress()

  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

export async function getNetwork(): Promise<{ name: string; chainId: number }> {
  const provider = await getProvider()
  const network = await provider.getNetwork()
  return {
    name: network.name,
    chainId: Number(network.chainId),
  }
}

export async function switchToAmoyNetwork(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined.')
  }

  const ethereum = (window as any).ethereum
  if (!ethereum) {
    throw new Error('MetaMask is not installed.')
  }

  const amoyChainId = '0x13882' // 80002 in hex

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: amoyChainId }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      // Network not added, try to add it
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: amoyChainId,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology'],
              blockExplorerUrls: ['https://amoy.polygonscan.com'],
            },
          ],
        })
      } catch (addError) {
        throw new Error(`Failed to add Polygon Amoy network: ${addError}`)
      }
    } else {
      throw new Error(`Failed to switch to Polygon Amoy: ${error.message}`)
    }
  }
}

export function clearCache(): void {
  cachedProvider = null
  cachedSigner = null
}
