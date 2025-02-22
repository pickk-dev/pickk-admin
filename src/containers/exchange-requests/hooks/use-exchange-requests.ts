import {gql, useQuery} from '@apollo/client';
import {
  Courier,
  ExchangeRequest,
  ExchangeRequestFilter,
  ExchangeRequestStatus,
  Order,
  OrderBuyer,
  OrderItem,
  OrderReceiver,
  Shipment,
  QueryMeSellerExchangeRequestsArgs,
} from '@pickk/common';

import {BoardDataFetcher} from '@components/common/templates/board';

import {useExchangeRequestsCount} from './use-exchange-requests-count';

const GET_EXCHANGE_REQUESTS = gql`
  query MeSellerExchangeRequests(
    $exchangeRequestFilter: ExchangeRequestFilter
    $pageInput: PageInput
  ) {
    meSellerExchangeRequests(
      exchangeRequestFilter: $exchangeRequestFilter
      pageInput: $pageInput
    ) {
      merchantUid
      orderItemMerchantUid
      productVariantName
      quantity
      status
      requestedAt
      faultOf
      reason
      orderItem {
        id
        orderMerchantUid
        itemName
        itemFinalPrice
        recommenderNickname
        order {
          id
          buyer {
            id
            name
            phoneNumber
          }
          receiver {
            id
            receiverName
            phoneNumber
            postalCode
            baseAddress
            detailAddress
          }
        }
      }
      reShipment {
        id
        courierId
        trackCode
        courier {
          id
          name
        }
      }
    }
  }
`;

export type ExchangeRequestDataType = Pick<
  ExchangeRequest,
  | 'merchantUid' /** orderItemMerchantUid와 동일 */
  | 'orderItemMerchantUid'
  | 'status'
  | 'productVariantName'
  | 'requestedAt'
  | 'faultOf'
  | 'reason'
  | 'quantity'
> & {
  orderItem: Pick<
    OrderItem,
    | 'id'
    | 'orderMerchantUid'
    | 'itemName'
    | 'itemFinalPrice'
    | 'recommenderNickname'
  > & {
    order: Pick<Order, 'id'> & {
      buyer: Pick<OrderBuyer, 'id' | 'name' | 'phoneNumber'>;
      receiver: Pick<
        OrderReceiver,
        | 'id'
        | 'receiverName'
        | 'phoneNumber'
        | 'postalCode'
        | 'baseAddress'
        | 'detailAddress'
      >;
    };
  };
  reShipment: Pick<Shipment, 'id' | 'courierId' | 'trackCode'> & {
    courier: Pick<Courier, 'id' | 'name'>;
  };
};

export const flattenExchangeRequestRecord = (
  record: ExchangeRequestDataType,
) => {
  const {orderItem, reShipment} = record;
  const {buyer, receiver} = orderItem.order;
  return {
    ...record,
    orderMerchantUid: orderItem.orderMerchantUid,
    itemName: orderItem.itemName,
    buyerName: buyer.name,
    buyerPhoneNumber: buyer.phoneNumber,
    receiverReceiverName: receiver.receiverName,
    receiverPhoneNumber: receiver.phoneNumber,
    reShipmentCourierId: reShipment?.courierId,
    reShipmentCourierName: reShipment?.courier.name,
    reShipmentTrackCode: reShipment?.trackCode,
    receiverPostalCode: receiver.postalCode,
    receiverBaseAddress: receiver.baseAddress,
    receiverDetailAddress: receiver.detailAddress,
    receiverFullAddress: `${receiver.baseAddress} ${receiver.detailAddress}`,
    itemFinalPrice: orderItem.itemFinalPrice,
    recommenderNickname: orderItem.recommenderNickname,
  };
};

export type FlattenExchangeRequestDataType = ReturnType<
  typeof flattenExchangeRequestRecord
>;

const {Pending, ...exchangeRequestStatus} = ExchangeRequestStatus;

export const exchangeRequestsBaseFilter: ExchangeRequestFilter = {
  statusIn: Object.values(exchangeRequestStatus),
};

export const useExchangeRequests: BoardDataFetcher<
  FlattenExchangeRequestDataType,
  ExchangeRequestFilter
> = ({filter, pageInput}) => {
  const exchangeRequestFilter: ExchangeRequestFilter = {
    ...filter,
    ...exchangeRequestsBaseFilter,
    /** status 필터가 있는 경우 statusIn은 무시된다. */
    ...(filter.status ? {statusIn: undefined} : {}),
  };

  const {data, loading, refetch} = useQuery<
    {meSellerExchangeRequests: ExchangeRequestDataType[]},
    QueryMeSellerExchangeRequestsArgs
  >(GET_EXCHANGE_REQUESTS, {
    variables: {
      exchangeRequestFilter,
      pageInput,
    },
  });

  const total = useExchangeRequestsCount({filter: exchangeRequestFilter});

  return {
    data: !!data?.meSellerExchangeRequests
      ? data.meSellerExchangeRequests.map(flattenExchangeRequestRecord)
      : [],
    total,
    loading,
    refetch,
  };
};
