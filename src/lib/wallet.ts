import type AtpAgent from '@atproto/api'
import {secp256k1} from '@noble/curves/secp256k1'
import {base16, base58, base64} from '@scure/base'
import {blake2b, blake2bHex} from 'blakejs'
import {keccak256} from 'js-sha3'
import {sha256} from 'js-sha256'
import {type Hex} from 'viem'
import {privateKeyToAccount} from 'viem/accounts'
import {z} from 'zod'

import {FIREFLY_API_URL} from '#/state/queries/wallet'
import {
  type EtheriumWallet,
  type F1r3SkyWallet,
  type WalletPrivateKey,
} from '#/state/wallets'
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

export function getAddressFromPublicKey(publicKey: Uint8Array): string {
  const publicKeyHash = keccak256(publicKey.slice(1)).slice(-40).toUpperCase()
  const ethHash = keccak256(base16.decode(publicKeyHash)).toUpperCase()

  const token = TOKENS.firecap.id
  const version = TOKENS.firecap.version
  const payload = `${token}${version}${ethHash}`

  const payloadBytes = base16.decode(payload)
  const checksum = blake2bHex(payloadBytes, undefined, 32)
    .slice(0, 8)
    .toUpperCase()

  return base58.encode(base16.decode(payload + checksum))
}

export function getPublicKeyFromPrivateKey(
  privateKey: Uint8Array | Hex,
): Uint8Array {
  return secp256k1.getPublicKey(privateKey, false)
}

export function generateAddressFromPrivateKey(
  privateKey: Uint8Array | Hex,
): string {
  const publicKey = getPublicKeyFromPrivateKey(privateKey)
  return getAddressFromPublicKey(publicKey)
}

export function fetchF1r3SkyWalletState(
  agent: AtpAgent,
  wallet: F1r3SkyWallet,
  returnCallback: (state: F1r3SkyWallet) => void,
) {
  const address = getAddressFromPublicKey(
    getPublicKeyFromPrivateKey(wallet.privateKey),
  )

  fetch(`${FIREFLY_API_URL}/api/wallets/${address}/state`, {
    headers: new Headers({
      Authorization: `Bearer ${agent.session?.accessJwt}`,
    }),
  })
    .then(req => req.json())
    .then(returnCallback)
}

export function fetchEtheriumWalletState(
  wallet: EtheriumWallet,
  returnCallback: (state: EtheriumWallet) => void,
) {
  console.log(wallet)
  let account = privateKeyToAccount(wallet.privateKey as Hex)

  returnCallback({
    ...wallet,
    account,
  })
}

export function generateKeyAndAddress(): WalletPrivateKey {
  return secp256k1.utils.randomPrivateKey()
}

export async function saveWalletToFS(key: WalletPrivateKey) {
  const encodedKey = base64.encode(key as Uint8Array)
  const content = `-----BEGIN EC PRIVATE KEY-----\n${encodedKey}\n-----END EC PRIVATE KEY-----`

  return await saveToDevice('walletKey.pem', content, 'application/x-pem-file')
}

export function signPayload(payload: Uint8Array, key: WalletPrivateKey) {
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
