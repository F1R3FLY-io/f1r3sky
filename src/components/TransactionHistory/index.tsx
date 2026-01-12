import {Fragment, useMemo, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {type Request, type Transfer} from '@f1r3fly-io/embers-client-sdk'
import {
  type Boost,
  type WalletStateAndHistory,
} from '@f1r3fly-io/embers-client-sdk'
import {type LinkProps} from '@react-navigation/native'

import {type AllNavigatorParams} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
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

export function TransactionHistory(walletState: WalletStateAndHistory) {
  const {requests, boosts, transfers} = walletState
  const requestsData = useRequestTableDate(requests)
  const transfersData = useTransferTableDate(transfers)
  const boostsData = useBoostTableData(boosts)

  return (
    <PagerWithHeader items={TABLE_VIEWS} isHeaderReady={true} initialPage={2}>
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
  navigate?: (data: T) => LinkProps<AllNavigatorParams>
}

type CustomRow<T> = {
  type: 'custom'
  maxLineNumber: number
  formatCel: (data: T) => string
  navigate?: (data: T) => LinkProps<AllNavigatorParams>
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
                  {
                    backgroundColor: '#1E2936',
                    borderBottomWidth: 2,
                    borderColor: '#34383C',
                    height: 40,
                  },
                  ...commonCelStyles,
                ]}>
                {rowConfig.order ? (
                  <TouchableOpacity
                    onPress={() => onOrder?.(i)}
                    accessibilityRole="button"
                    style={[a.flex_row, a.gap_xs]}>
                    <Text style={[a.text_sm, a.font_heavy_bold]}>
                      {rowConfig.name}
                    </Text>
                    <Sort />
                  </TouchableOpacity>
                ) : (
                  <Text style={[a.text_sm, a.font_heavy_bold]}>
                    {rowConfig.name}
                  </Text>
                )}
              </View>
              {dataPage.map((item, i) => (
                <Fragment key={i}>
                  {rowConfig.type === 'text' && rowConfig.navigate && (
                    <InlineLinkText
                      to={rowConfig.navigate(item)}
                      label={rowConfig.name}
                      numberOfLines={rowConfig.maxLineNumber}
                      style={[a.leading_normal, ...commonCelStyles]}>
                      {item[rowConfig.field] as any}
                    </InlineLinkText>
                  )}
                  {rowConfig.type === 'text' && !rowConfig.navigate && (
                    <Text
                      numberOfLines={rowConfig.maxLineNumber}
                      style={[a.leading_normal, ...commonCelStyles]}>
                      {item[rowConfig.field] as any}
                    </Text>
                  )}
                  {rowConfig.type === 'custom' && rowConfig.navigate && (
                    <InlineLinkText
                      to={rowConfig.navigate(item)}
                      label={rowConfig.name}
                      numberOfLines={rowConfig.maxLineNumber}
                      style={[a.leading_normal, ...commonCelStyles]}>
                      {rowConfig.formatCel(item)}
                    </InlineLinkText>
                  )}
                  {rowConfig.type === 'custom' && !rowConfig.navigate && (
                    <Text
                      numberOfLines={rowConfig.maxLineNumber}
                      style={[a.leading_normal, ...commonCelStyles]}>
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
              ))}
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
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#4B6179',
                      backgroundColor: '#153455',
                    },
                    a.justify_center,
                    a.align_center,
                  ]}
                  onPress={() => setSelectedPage(page)}
                  accessibilityRole="button">
                  <Text
                    style={[
                      page === selectedPage && {
                        color: '#0C66E4',
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

type Sort<T> = {
  desc: boolean
  col: keyof T
}

function flipSortOrder<T>(current: Sort<T>, flip: keyof T): Sort<T> {
  return current.col === flip
    ? {
        ...current,
        desc: !current.desc,
      }
    : {
        col: flip,
        desc: true,
      }
}

function compare<T>(l: T, r: T): number {
  if (l instanceof Date && r instanceof Date) {
    return r.getTime() - l.getTime()
  } else if (typeof l === 'string' && typeof r === 'string') {
    return r.localeCompare(l)
  } else if (typeof l === 'number' && typeof r === 'number') {
    return r - l
  }
  throw new Error('wrong types')
}

function sortBySortOrder<T>(data: T[], sort: Sort<T>): T[] {
  return [...data].sort((litem, ritem) => {
    const l = litem[sort.col]
    const r = ritem[sort.col]
    return sort.desc ? compare(l, r) : compare(r, l)
  })
}

const REQUEST_COLUMNS = ['ID', 'Date', 'Amount'] as const
type RequestColumn = (typeof REQUEST_COLUMNS)[number]

function useRequestTableDate(
  requests: Array<Request>,
): TableProps<RequestColumn, Request> {
  const [requestsOrder, setRequestsOrder] = useState<Sort<Request>>({
    desc: true,
    col: 'date',
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
            `${request.date.toLocaleDateString()}\n${request.date.toLocaleTimeString()}`,
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
          setRequestsOrder(state => flipSortOrder(state, 'date'))
        }
      },
    }),
    [requestsOrder, requests],
  )
}

const TRANSFER_COLUMNS = ['ID', 'Date', 'Amount', 'Address'] as const
type TransferColumn = (typeof TRANSFER_COLUMNS)[number]

function useTransferTableDate(
  transfers: Array<Transfer>,
): TableProps<TransferColumn, Transfer> {
  const [transfersOrder, setTransfersOrder] = useState<Sort<Transfer>>({
    desc: true,
    col: 'date',
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
            `${transfer.date.toLocaleDateString()}\n${transfer.date.toLocaleTimeString()}`,
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
          type: 'text',
          maxLineNumber: 1,
          field: 'toAddress',
        },
      ],
      data: sortBySortOrder(transfers, transfersOrder),
      rowsPerPage: 5,
      onOrder: (index: number) => {
        if (index === 1) {
          setTransfersOrder(state => flipSortOrder(state, 'date'))
        }
      },
    }),
    [transfersOrder, transfers],
  )
}

const BOOST_COLUMNS = ['Date', 'Type', 'Amount', 'Username', 'Post'] as const
type BoostColumn = (typeof BOOST_COLUMNS)[number]

function useBoostTableData(
  boosts: Array<Boost>,
): TableProps<BoostColumn, Boost> {
  const [boostOrder, setBoostOrder] = useState<Sort<Boost>>({
    desc: true,
    col: 'date',
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
            `${boost.date.toLocaleDateString()}\n${boost.date.toLocaleTimeString()}`,
        },
        {
          name: BOOST_COLUMNS[1],
          order: true,
          flex: 2,
          type: 'jsx',
          renderCel: boost =>
            boost.direction === 'incoming' ? <Incoming /> : <Outgoing />,
        },
        {
          name: BOOST_COLUMNS[2],
          flex: 2,
          type: 'custom',
          maxLineNumber: 1,
          formatCel: request => request.amount.toString(),
        },
        {
          name: BOOST_COLUMNS[3],
          flex: 3,
          navigate: boost => ({
            screen: 'Profile',
            params: {
              name: boost.username,
            },
          }),
          type: 'custom',
          maxLineNumber: 1,
          formatCel: boost => '@' + sanitizeHandle(boost.username),
        },
        {
          name: BOOST_COLUMNS[4],
          flex: 3,
          navigate: boost => ({
            screen: 'PostThread',
            params: {
              name: boost.username,
              rkey: boost.post,
            },
          }),
          type: 'text',
          maxLineNumber: 1,
          field: 'post',
        },
      ],
      data: sortBySortOrder(boosts, boostOrder),
      rowsPerPage: 5,
      onOrder: (index: number) => {
        if (index === 0) {
          setBoostOrder(state => flipSortOrder(state, 'date'))
        } else if (index === 1) {
          setBoostOrder(state => flipSortOrder(state, 'direction'))
        }
      },
    }),
    [boostOrder, boosts],
  )
}
