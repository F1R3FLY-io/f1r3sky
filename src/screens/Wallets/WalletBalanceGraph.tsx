import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {Defs, LinearGradient, Path, Stop} from 'react-native-svg'
import {AreaChart, XAxis} from 'react-native-svg-charts'
import {type WalletStateAndHistory} from '@f1r3fly-io/embers-client-sdk'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'

const BALANCE_GRAPH_SCALES = ['1H', '1D', '1W', '1M', '3M', '6M'] as const
type BalanceGraphScale = (typeof BALANCE_GRAPH_SCALES)[number]

type GraphEntry = {
  value: bigint
  date: Date
}

export type WalletBalanceGraphProps = {
  walletState: WalletStateAndHistory
}

const generateDatesByOffset = (
  from: Date,
  size: number,
  offset: number,
  initialOffset: number = offset,
) => {
  let date = new Date(from)
  let result = []

  date.setDate(date.getDate() - initialOffset)
  result.push(new Date(date))

  while (result.length !== size) {
    date.setDate(date.getDate() - offset)
    result.push(new Date(date))
  }

  return result
}

export default function WalletBalanceGraph({
  walletState,
}: WalletBalanceGraphProps) {
  const t = useTheme()
  const {_} = useLingui()
  const {balance, boosts, requests, transfers} = walletState

  const [activeScale, setActiveScale] = useState<BalanceGraphScale>('1M')

  const [labels, minDate, maxDate] = useMemo(() => {
    let minDate = new Date()
    let maxDate = new Date()
    let labels: Date[]
    switch (activeScale) {
      case '1H':
        minDate.setHours(minDate.getHours() - 1)
        // Generate labels for every 10 minutes
        labels = []
        for (let i = 0; i <= 60; i += 10) {
          let date = new Date(minDate)
          date.setMinutes(date.getMinutes() + i)
          labels.push(date)
        }
        break
      case '1D':
        minDate.setHours(minDate.getHours() - 24)
        // Generate labels for every 4 hours
        labels = []
        for (let i = 0; i <= 24; i += 4) {
          let date = new Date(minDate)
          date.setHours(date.getHours() + i)
          labels.push(date)
        }
        break
      case '1W':
        minDate.setDate(minDate.getDate() - 7)
        labels = generateDatesByOffset(maxDate, 6, 1)
        break
      case '1M':
        minDate.setDate(minDate.getDate() - 30)
        labels = generateDatesByOffset(maxDate, 8, 4, 1)
        break
      case '3M':
        minDate.setDate(minDate.getDate() - 90)
        labels = generateDatesByOffset(maxDate, 8, 12, 3)
        break
      case '6M':
        minDate.setDate(minDate.getDate() - 180)
        labels = generateDatesByOffset(maxDate, 8, 24, 6)
        break
    }

    return [labels, minDate, maxDate]
  }, [activeScale])

  const allWalletStates = useMemo(() => {
    const [allWalletStates] = [
      ...requests
        .filter(value => value.status === 'done')
        .map(value => ({
          type: 'request' as const,
          value,
        })),
      ...boosts.map(value => ({
        type: 'boost' as const,
        value,
      })),
      ...transfers.map(value => ({
        type: 'transfer' as const,
        value,
      })),
    ]
      .sort((l, r) => r.value.date.getTime() - l.value.date.getTime())
      .reduce(
        ([allWalletStates, lastBalance], item) => {
          let value: bigint
          switch (item.type) {
            case 'request': {
              value = lastBalance + item.value.amount
              break
            }
            case 'boost': {
              value =
                item.value.direction === 'incoming'
                  ? lastBalance - item.value.amount
                  : lastBalance + item.value.amount
              break
            }
            case 'transfer': {
              value =
                item.value.direction === 'incoming'
                  ? lastBalance - item.value.amount
                  : lastBalance + item.value.amount + item.value.cost
              break
            }
          }

          return [
            [
              ...allWalletStates,
              {
                value,
                date: item.value.date,
              },
            ],
            value,
          ]
        },
        [[], balance] as [GraphEntry[], bigint],
      )

    return allWalletStates
  }, [balance, boosts, requests, transfers])

  const data = useMemo(() => {
    const maxBoundary = {
      value: balance,
      date: maxDate,
    }

    const inRange = allWalletStates.filter(item => item.date > minDate)

    let minBoundary: GraphEntry[] = []
    if (
      allWalletStates.length !== 0 &&
      allWalletStates.at(-1)!.date <= minDate
    ) {
      // patch balance on minDate position when first transaction is out of range
      minBoundary = [
        allWalletStates.reduceRight(
          (state, item) =>
            item.date <= minDate
              ? {
                  value: item.value,
                  date: minDate,
                }
              : state,
          allWalletStates.at(-1)!,
        ),
      ]
    } else if (inRange.length !== 0) {
      // patch balance on minDate position when first transaction is in range
      inRange.at(-1)!.date = minDate
    }

    return [maxBoundary, ...inRange, ...minBoundary]
  }, [allWalletStates, balance, maxDate, minDate])

  return (
    <View>
      <View style={[a.flex_row, a.gap_sm, a.self_end]}>
        <Toggle.Group
          type="radio"
          label={_(msg`Balance graph scale`)}
          values={[activeScale]}
          onChange={([value]) => setActiveScale(value)}>
          <View style={[a.flex, a.flex_row, a.gap_md]}>
            {BALANCE_GRAPH_SCALES.map(scale => (
              <Toggle.Item
                key={scale}
                name={scale}
                value={scale === activeScale}
                label={_(msg`${scale}`)}>
                {({selected}) => (
                  <Toggle.LabelText
                    style={[
                      a.px_sm,
                      a.py_xs,
                      a.text_sm,
                      a.border,
                      a.rounded_full,
                      selected ? undefined : t.atoms.text_contrast_medium,
                      {
                        backgroundColor: selected
                          ? '#153455'
                          : a.bg_transparent.backgroundColor,
                        borderColor: selected
                          ? '#4B6179'
                          : a.bg_transparent.backgroundColor,
                      },
                    ]}>
                    <Trans>{scale}</Trans>
                  </Toggle.LabelText>
                )}
              </Toggle.Item>
            ))}
          </View>
        </Toggle.Group>
      </View>

      <AreaChart
        data={data}
        yMin={0}
        xMin={minDate as any}
        xMax={maxDate as any}
        xAccessor={({item}) => item.date as any}
        yAccessor={({item}) => Number(item.value)}
        style={{height: 115, marginBottom: 25}}
        contentInset={{
          top: a.pt_2xl.paddingTop,
          bottom: a.pb_2xl.paddingBottom,
        }}
        svg={{fill: 'url(#gradient)'}}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#208BFE" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#1E2936" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Line />
      </AreaChart>
      <XAxis
        data={labels}
        {...{min: minDate, max: maxDate}}
        xAccessor={({item}) => item as any}
        formatLabel={date =>
          activeScale === '1H' || activeScale === '1D'
            ? date.toLocaleString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : date.toLocaleString(undefined, {
                month: '2-digit',
                day: '2-digit',
              })
        }
        svg={{
          fill: t.atoms.text_contrast_medium.color,
          ...a.text_xs,
          y: 5,
        }}
      />
    </View>
  )
}

const Line = (props: {line?: string}) => (
  <Path key="line" d={props.line} stroke="#208BFE" fill="none" />
)
