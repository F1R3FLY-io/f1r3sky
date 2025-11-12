import {Fragment, type JSX, useMemo, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {
  type Address,
  type Request,
  type Transfer,
} from '@f1r3fly-io/embers-client-sdk'
import {
  type Boost,
  type WalletStateAndHistory,
} from '@f1r3fly-io/embers-client-sdk'
import {type LinkProps} from '@react-navigation/native'

import {type AllNavigatorParams} from '#/lib/routes/types'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {
  Incoming,
  LeftArrow,
  Outgoing,
  RightArrow,
  Sort,
} from '#/components/icons/Wallet'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

const TABLE_VIEWS = ['Requests', 'Exchanges', 'Transfers', 'Boosts']
type TransactionHistoryProps = {
  requests: WalletStateAndHistory['requests']
  boosts: WalletStateAndHistory['boosts']
  transfers: WalletStateAndHistory['transfers']
  address: Address
}

export function TransactionHistory({
  requests,
  boosts,
  transfers,
  address,
}: TransactionHistoryProps) {
  const requestsData = useRequestTableDate(requests)
  const transfersData = useTransferTableDate(address, transfers)
  const boostsData = useBoostTableData(address, boosts)

  return (
    <PagerWithHeader items={TABLE_VIEWS} isHeaderReady initialPage={2}>
      {() => (
        <View style={[a.px_3xl, a.py_lg]}>
          <Table {...requestsData} />
        </View>
      )}
      {() => <View style={[a.px_3xl, a.py_lg]} />}
      {() => (
        <View style={[a.px_3xl, a.py_lg]}>
          <Table {...transfersData} />
        </View>
      )}
      {() => (
        <View style={[a.px_3xl, a.py_lg]}>
          <Table {...boostsData} />
        </View>
      )}
    </PagerWithHeader>
  )
}

type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any
}

type CommonRow<T> = {
  name: T
  order?: boolean
  flex?: number
}

type TextRow<T> = {
  type: 'text'
  maxLineNumber: number
  field: KeyOfType<T, string>
  navigate?: (data: T) => LinkProps<AllNavigatorParams> | undefined
}

type CustomRow<T> = {
  type: 'custom'
  maxLineNumber: number
  formatCel: (data: T) => string
  navigate?: (data: T) => LinkProps<AllNavigatorParams> | undefined
}

type JSXRow<T> = {
  type: 'jsx'
  renderCel: (val: T) => JSX.Element
}

type TableProps<T extends string, V> = {
  rowsConfig: (CommonRow<T> & (TextRow<V> | CustomRow<V> | JSXRow<V>))[]
  data: V[]
  rowsPerPage: number
  onOrder?: (column: number) => void
}

const Table = <T extends string, V>({
  rowsConfig,
  data,
  rowsPerPage,
  onOrder,
}: TableProps<T, V>) => {
  const t = useTheme()
  const [selectedPage, setSelectedPage] = useState(0)

  const maxPage = Math.max(Math.ceil(data.length / rowsPerPage) - 1, 0)
  const dataPage = data.slice(
    selectedPage * rowsPerPage,
    (selectedPage + 1) * rowsPerPage,
  )

  return (
    <View>
      <View style={[a.flex_row]}>
        {rowsConfig.map((rowConfig, i) => {
          const firstHeader = i === 0
          const lastHeader = i === rowsConfig.length - 1

          const commonCelStyles = [
            a.py_md,
            a.px_xs,
            firstHeader && a.pl_2xl,
            lastHeader && a.pr_2xl,
          ]

          return (
            <View
              key={rowConfig.name}
              style={[
                a.flex_col,
                a.justify_between,
                {
                  flex: rowConfig.flex || 1,
                },
              ]}>
              <View
                style={[
                  a.border_b,
                  t.atoms.bg_contrast_50,
                  t.atoms.border_contrast_high,
                  {
                    height: 40,
                  },
                  ...commonCelStyles,
                ]}>
                {rowConfig.order ? (
                  <TouchableOpacity
                    onPress={() => onOrder?.(i)}
                    accessibilityRole="button"
                    style={[a.flex_row, a.gap_xs]}>
                    <Text style={[a.text_sm, a.font_bold]}>
                      {rowConfig.name}
                    </Text>
                    <Sort />
                  </TouchableOpacity>
                ) : (
                  <Text style={[a.text_sm, a.font_bold]}>{rowConfig.name}</Text>
                )}
              </View>
              {dataPage.map((item, i) => {
                let to =
                  (rowConfig.type === 'text' || rowConfig.type === 'custom') &&
                  rowConfig.navigate?.(item)

                return (
                  <Fragment key={i}>
                    {rowConfig.type === 'text' && to && (
                      <InlineLinkText
                        to={to}
                        label={rowConfig.name}
                        numberOfLines={rowConfig.maxLineNumber}
                        style={[a.leading_relaxed, ...commonCelStyles]}>
                        {item[rowConfig.field] as any}
                      </InlineLinkText>
                    )}
                    {rowConfig.type === 'text' && !to && (
                      <Text
                        numberOfLines={rowConfig.maxLineNumber}
                        style={[a.leading_relaxed, ...commonCelStyles]}>
                        {item[rowConfig.field] as any}
                      </Text>
                    )}
                    {rowConfig.type === 'custom' && to && (
                      <InlineLinkText
                        to={to}
                        label={rowConfig.name}
                        numberOfLines={rowConfig.maxLineNumber}
                        style={[a.leading_relaxed, ...commonCelStyles]}>
                        {rowConfig.formatCel(item)}
                      </InlineLinkText>
                    )}
                    {rowConfig.type === 'custom' && !to && (
                      <Text
                        numberOfLines={rowConfig.maxLineNumber}
                        style={[a.leading_relaxed, ...commonCelStyles]}>
                        {rowConfig.formatCel(item)}
                      </Text>
                    )}
                    {rowConfig.type === 'jsx' && (
                      <View style={commonCelStyles}>
                        {rowConfig.renderCel(item)}
                      </View>
                    )}
                    <Divider />
                  </Fragment>
                )
              })}
            </View>
          )
        })}
      </View>
      {maxPage !== 0 && (
        <View style={[a.flex_row, a.py_md, a.align_center]}>
          {selectedPage !== 0 && (
            <TouchableOpacity
              style={[a.p_md]}
              onPress={() => setSelectedPage(selectedPage => selectedPage - 1)}
              accessibilityRole="button">
              <LeftArrow />
            </TouchableOpacity>
          )}
          {[
            selectedPage - 2,
            selectedPage - 1,
            selectedPage,
            selectedPage + 1,
            selectedPage + 2,
          ].map(
            page =>
              page >= 0 &&
              page <= maxPage && (
                <TouchableOpacity
                  key={page}
                  style={[
                    {
                      height: 32,
                      width: 32,
                    },
                    page === selectedPage && {
                      ...a.border,
                      borderRadius: 10,
                      borderColor: t.palette.contrast_300,
                      backgroundColor: t.palette.primary_100,
                    },
                    a.justify_center,
                    a.align_center,
                  ]}
                  onPress={() => setSelectedPage(page)}
                  accessibilityRole="button">
                  <Text
                    style={[
                      page === selectedPage && {
                        color: t.palette.primary_500,
                      },
                      page !== selectedPage && t.atoms.text_contrast_medium,
                    ]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              ),
          )}
          {selectedPage !== maxPage && (
            <TouchableOpacity
              style={[a.p_md]}
              onPress={() => setSelectedPage(selectedPage => selectedPage + 1)}
              accessibilityRole="button">
              <RightArrow />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

type SortConfig<T> = {
  desc: boolean
  key: keyof T
  pred: (l: T, r: T) => number
}

function flipSortOrder<T>(
  current: SortConfig<T>,
  flip: keyof T,
  pred: (l: T, r: T) => number,
): SortConfig<T> {
  return current.key === flip
    ? {
        ...current,
        desc: !current.desc,
      }
    : {
        key: flip,
        desc: true,
        pred,
      }
}

function sortBySortOrder<T>(data: T[], {pred, desc}: SortConfig<T>): T[] {
  return [...data].sort((litem, ritem) =>
    desc ? pred(litem, ritem) : pred(ritem, litem),
  )
}

const REQUEST_COLUMNS = ['ID', 'Date', 'Amount'] as const
type RequestColumn = (typeof REQUEST_COLUMNS)[number]

function useRequestTableDate(
  requests: Array<Request>,
): TableProps<RequestColumn, Request> {
  const [requestsOrder, setRequestsOrder] = useState<SortConfig<Request>>({
    desc: true,
    key: 'timestamp',
    pred: (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
  })

  return useMemo(
    () => ({
      rowsConfig: [
        {
          name: REQUEST_COLUMNS[0],
          flex: 3,
          type: 'text',
          maxLineNumber: 1,
          field: 'id',
        },
        {
          name: REQUEST_COLUMNS[1],
          order: true,
          flex: 3,
          type: 'custom',
          maxLineNumber: 2,
          formatCel: request =>
            `${request.timestamp.toLocaleDateString()}\n${request.timestamp.toLocaleTimeString()}`,
        },
        {
          name: REQUEST_COLUMNS[2],
          flex: 2,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: request => request.amount.toString(),
        },
      ],
      data: sortBySortOrder(requests, requestsOrder),
      rowsPerPage: 5,
      onOrder: (index: number) => {
        if (index === 1) {
          setRequestsOrder(state =>
            flipSortOrder(
              state,
              'timestamp',
              (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
            ),
          )
        }
      },
    }),
    [requestsOrder, requests],
  )
}

const TRANSFER_COLUMNS = ['ID', 'Date', 'Amount', 'Address'] as const
type TransferColumn = (typeof TRANSFER_COLUMNS)[number]

function useTransferTableDate(
  address: Address,
  transfers: Transfer[],
): TableProps<TransferColumn, Transfer> {
  const [transfersOrder, setTransfersOrder] = useState<SortConfig<Transfer>>({
    desc: true,
    key: 'timestamp',
    pred: (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
  })

  return useMemo(
    () => ({
      rowsConfig: [
        {
          name: TRANSFER_COLUMNS[0],
          flex: 2,
          type: 'text',
          maxLineNumber: 1,
          field: 'id',
        },
        {
          name: TRANSFER_COLUMNS[1],
          order: true,
          flex: 2,
          type: 'custom',
          maxLineNumber: 2,
          formatCel: transfer =>
            `${transfer.timestamp.toLocaleDateString()}\n${transfer.timestamp.toLocaleTimeString()}`,
        },
        {
          name: TRANSFER_COLUMNS[2],
          flex: 2,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: request => request.amount.toString(),
        },
        {
          name: TRANSFER_COLUMNS[3],
          flex: 3,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: request =>
            address.value !== request.to.value
              ? request.to.value
              : request.from.value,
        },
      ],
      data: sortBySortOrder(transfers, transfersOrder),
      rowsPerPage: 5,
      onOrder: (index: number) => {
        if (index === 1) {
          setTransfersOrder(state =>
            flipSortOrder(
              state,
              'timestamp',
              (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
            ),
          )
        }
      },
    }),
    [transfers, transfersOrder, address.value],
  )
}

const BOOST_COLUMNS = ['Date', 'Type', 'Amount', 'Username', 'Post'] as const
type BoostColumn = (typeof BOOST_COLUMNS)[number]

function useBoostTableData(
  address: Address,
  boosts: Array<Boost>,
): TableProps<BoostColumn, Boost> {
  const [boostOrder, setBoostOrder] = useState<SortConfig<Boost>>({
    desc: true,
    key: 'timestamp',
    pred: (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
  })

  return useMemo(
    () => ({
      rowsConfig: [
        {
          name: BOOST_COLUMNS[0],
          order: true,
          flex: 3,
          type: 'custom',
          maxLineNumber: 2,
          formatCel: boost =>
            `${boost.timestamp.toLocaleDateString()}\n${boost.timestamp.toLocaleTimeString()}`,
        },
        {
          name: BOOST_COLUMNS[1],
          order: true,
          flex: 2,
          type: 'jsx',
          renderCel: boost =>
            address.value === boost.to.value ? <Incoming /> : <Outgoing />,
        },
        {
          name: BOOST_COLUMNS[2],
          flex: 2,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: request => request.amount.toString(),
        },
        {
          name: BOOST_COLUMNS[4],
          flex: 3,
          navigate: boost =>
            boost.postId
              ? {
                  screen: 'PostThread',
                  params: {
                    name: boost.postAuthorDid,
                    rkey: boost.postId,
                  },
                }
              : undefined,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: boost => boost.postId || '-',
        },
      ],
      data: sortBySortOrder(boosts, boostOrder),
      rowsPerPage: 5,
      onOrder: (index: number) => {
        if (index === 0) {
          setBoostOrder(state =>
            flipSortOrder(
              state,
              'timestamp',
              (l, r) => r.timestamp.getTime() - l.timestamp.getTime(),
            ),
          )
        } else if (index === 1) {
          setBoostOrder(state =>
            flipSortOrder(
              state,
              'to',
              (l, r) =>
                Number(address.value === l.to.value) -
                Number(address.value === r.to.value),
            ),
          )
        }
      },
    }),
    [address.value, boostOrder, boosts],
  )
}
