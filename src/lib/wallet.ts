import {secp256k1} from '@noble/curves/secp256k1'
import {base16, base58, base64} from '@scure/base'
import {blake2b, blake2bHex} from 'blakejs'
import {keccak256} from 'js-sha3'
import {type Hex} from 'viem'

import {FIREFLY_API_URL, WalletState} from '#/state/queries/wallet'
import {type FireCAPWallet, type WalletKey, WalletType} from '#/state/wallets'
import {saveToDevice} from './media/manip'

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

export async function fetchF1r3SkyWalletState(wallet: FireCAPWallet) {
  const address = getAddressFromPublicKey(
    getPublicKeyFromPrivateKey(wallet.privateKey),
  )

  const req = await fetch(`${FIREFLY_API_URL}/api/wallets/${address}/state`)
  const body = await req.json()

  return WalletState.parse(body)
}

export function generatePrivateKey(): WalletKey {
  return secp256k1.utils.randomPrivateKey()
}

export async function saveWalletToFS(
  key: WalletKey,
  address: string,
  type: WalletType,
) {
  switch (type) {
    case WalletType.F1R3CAP:
      const encodedKey = base64.encode(key as Uint8Array)
      const content = `-----BEGIN EC PRIVATE KEY-----\n${encodedKey}\n-----END EC PRIVATE KEY-----`

      return await saveToDevice(
        `${address}.pem`,
        content,
        'application/x-pem-file',
      )
    case WalletType.ETHEREUM:
      return await saveToDevice(`${address}.key`, key, 'application/x-pem-file')
  }
}

export function signPayload(payload: Uint8Array, key: WalletKey) {
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
