import {useMemo, useReducer} from 'react'
import {
  Address,
  Amount,
  type PrivateKey,
  serializeKey,
} from '@f1r3fly-io/embers-client-sdk'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {saveToDevice} from './media/manip'

export async function saveWalletToFS(privateKey: PrivateKey) {
  return await saveToDevice(
    `${privateKey.getPublicKey().getAddress()}.json`,
    serializeKey(privateKey),
    'application/json',
  )
}

type ValidationResult<T, P, E extends string> =
  | {
      state: 'invalid'
      value: P | undefined
      error: E
    }
  | {
      state: 'valid'
      value: T
    }

const transferFieldValidators = {
  address: (
    value: Address | string | undefined,
  ): ValidationResult<Address, string, 'invalid'> => {
    if (value instanceof Address) {
      return {
        value,
        state: 'valid',
      }
    }

    if (value === undefined) {
      return {
        state: 'invalid',
        value,
        error: 'invalid',
      }
    }

    try {
      return {
        state: 'valid',
        value: Address.tryFrom(value),
      }
    } catch {
      return {
        state: 'invalid',
        value,
        error: 'invalid',
      }
    }
  },

  transferAddress: (
    walletAddress: string,
    value: string | undefined,
  ): ValidationResult<Address, string, 'invalid' | 'sameAddress'> => {
    const data = transferFieldValidators.address(value)
    if (data.state === 'invalid') {
      return data
    }

    if (data.value.value === walletAddress) {
      return {
        state: 'invalid',
        value,
        error: 'sameAddress',
      }
    }

    return data
  },

  amount: (
    currentBalance: bigint,
    value: Amount | bigint | undefined,
  ): ValidationResult<Amount, bigint, 'invalid' | 'lowBalance'> => {
    if (value instanceof Amount) {
      return {
        value,
        state: 'valid',
      }
    }

    if (value === undefined) {
      return {
        state: 'invalid',
        value,
        error: 'invalid',
      }
    }

    try {
      const amount = Amount.tryFrom(value)

      if (amount.value > currentBalance) {
        return {
          state: 'invalid',
          value,
          error: 'lowBalance',
        }
      }

      return {
        state: 'valid',
        value: amount,
      }
    } catch (e) {
      return {
        state: 'invalid',
        value,
        error: 'invalid',
      }
    }
  },

  description: (
    value: string | undefined,
  ): ValidationResult<string | undefined, never, never> => {
    return {
      state: 'valid',
      value,
    }
  },
}

export type TransferFieldValidators = typeof transferFieldValidators
export type TransferFieldName = keyof TransferFieldValidators

export type TransferValidatorState<Fields extends TransferFieldName> = {
  [K in Fields]: {state: 'empty'} | ReturnType<TransferFieldValidators[K]>
}

export type TransferValidatorContext<K extends TransferFieldName> =
  Parameters<TransferFieldValidators[K]> extends [...infer Context, any]
    ? Context
    : []

export type TransferValidationAction<Fields extends TransferFieldName> =
  | {
      [K in Fields]: {
        type: K
        payload: Parameters<TransferFieldValidators[K]>
      }
    }[Fields]
  | {
      type: 'revalidateAll'
      payload: {
        [K in Fields]: TransferValidatorContext<K>
      }
    }

export function useTransferValidator<Fields extends TransferFieldName>(
  config: Fields[],
) {
  const initialState = useMemo(
    () =>
      config.reduce(
        (state, name) => ({...state, [name]: {state: 'empty'}}),
        {} as TransferValidatorState<Fields>,
      ),
    [config],
  )

  const [state, dispatch] = useReducer(
    (state, action: TransferValidationAction<Fields>) => {
      if (action.type === 'revalidateAll') {
        return config.reduce((state, field) => {
          const fieldState = state[field]
          let value
          switch (fieldState.state) {
            case 'empty': {
              value = undefined
              break
            }
            case 'invalid': {
              value = fieldState.value
              break
            }
            case 'valid': {
              value = fieldState.value
              break
            }
          }

          const context = (action.payload as any)[field]

          return {
            ...state,
            [field]: (transferFieldValidators[field] as any)(...context, value),
          }
        }, state)
      }

      return {
        ...state,
        [action.type]: (transferFieldValidators[action.type] as any)(
          ...(action.payload as any),
        ),
      }
    },
    initialState,
  )

  return [state, dispatch, useFormatTransferError(state)] as const
}

function useFormatTransferError<Fields extends TransferFieldName>(
  state: TransferValidatorState<Fields>,
): string | undefined {
  const {_} = useLingui()

  if ('amount' in state) {
    const amountState =
      state.amount as TransferValidatorState<'amount'>['amount']
    if (amountState.state === 'invalid') {
      switch (amountState.error) {
        case 'invalid':
          return _(msg`Invalid amount`)
        case 'lowBalance':
          return _(msg`Not enough funds for transfer`)
      }
    }
  }

  if ('address' in state) {
    const addressState =
      state.address as TransferValidatorState<'address'>['address']
    if (addressState.state === 'invalid') {
      switch (addressState.error) {
        case 'invalid':
          return _(msg`Invalid address`)
      }
    }
  }

  if ('transferAddress' in state) {
    const addressState =
      state.transferAddress as TransferValidatorState<'transferAddress'>['transferAddress']
    if (addressState.state === 'invalid') {
      switch (addressState.error) {
        case 'invalid':
          return _(msg`Invalid address`)
        case 'sameAddress':
          return _(msg`Destination address and source address are the same`)
      }
    }
  }

  return undefined
}
