import {serializeKey} from '@f1r3fly-io/embers-client-sdk'

import {type UniWallet} from '#/state/wallets'
import {saveToDevice} from './media/manip'

export async function saveWalletToFS(wallet: UniWallet) {
  return await saveToDevice(
    `${wallet.address.value}.json`,
    serializeKey(wallet.privateKey),
    'application/json',
  )
}
