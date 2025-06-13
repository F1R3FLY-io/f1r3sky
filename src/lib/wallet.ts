import {secp256k1} from '@noble/curves/secp256k1'
import {base16, base58} from '@scure/base'
import {blake2b, blake2bHex} from 'blakejs'
import {keccak256} from 'js-sha3'
import {sha256} from 'js-sha256'
import {z} from 'zod'

import {Wallet} from '#/state/wallets'
import {saveToDevice} from './media/manip'

export const WalletSerialized = z.object({
  revAddress: z.string(),
  privateKey: z.string(),
})

export type WalletSerialized = z.infer<typeof WalletSerialized>

export const TOKENS = {
  firecap: {
    id: '000000',
    version: '00',
  },
}

export function verifyRevAddr(revAddr: string): boolean {
  try {
    const revBytes = base58.decode(revAddr)

    const payload = revBytes.slice(0, -4)
    const checksum = revBytes.slice(-4)

    const checksumCalc = blake2b(payload, undefined, 32).slice(0, 4)

    return checksum.every((byte, index) => byte === checksumCalc[index])
  } catch {
    return false
  }
}

export function hashAddress(address: string): number {
  const hash = sha256(address).slice(0, 12)
  const number = parseInt(hash, 16)
  return (number % 1000000) + 1
}

export function generateKeyAndAddress(): Wallet {
  const privateKey = secp256k1.utils.randomPrivateKey()
  const publicKey = secp256k1.getPublicKey(privateKey, false)

  const publicKeyHash = keccak256(publicKey.slice(1)).slice(-40).toUpperCase()
  const ethHash = keccak256(base16.decode(publicKeyHash)).toUpperCase()

  const token = TOKENS.firecap.id
  const version = TOKENS.firecap.version
  const payload = `${token}${version}${ethHash}`

  const payloadBytes = base16.decode(payload)
  const checksum = blake2bHex(payloadBytes, undefined, 32)
    .slice(0, 8)
    .toUpperCase()

  const revAddress = base58.encode(base16.decode(payload + checksum))

  return {
    address: revAddress,
    key: privateKey,
    hash: hashAddress(revAddress),
  }
}

export async function saveWalletToFS(wallet: Wallet) {
  const json: WalletSerialized = {
    revAddress: wallet.address,
    privateKey: base16.encode(wallet.key),
  }

  return await saveToDevice(
    'walletKey.json',
    JSON.stringify(json, undefined, 4),
    'application/json',
  )
}

export function parseWallet(content: string): Wallet | undefined {
  try {
    const json = JSON.parse(content)
    const parsed = WalletSerialized.parse(json)
    return {
      key: base16.decode(parsed.privateKey),
      address: parsed.revAddress,
      hash: hashAddress(parsed.revAddress),
    }
  } catch {
    return
  }
}

export function signPayload(payload: Uint8Array, key: Uint8Array) {
  const signature = secp256k1
    .sign(blake2b(payload, undefined, 32), key)
    .toDERRawBytes()

  const deployer = secp256k1.getPublicKey(key, false)

  return {
    sigAlgorithm: 'secp256k1',
    deployer,
    signature,
  }
}
