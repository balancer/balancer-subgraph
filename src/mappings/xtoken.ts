import {  XToken } from '../types/schema'
import { Paused, Unpaused, Transfer } from '../types/templates/XToken/XToken'
import { Address, log, BigInt } from '@graphprotocol/graph-ts'
import {ZERO_BD, tokenToDecimal, createPoolShareEntity} from './helpers'
import {
  Pool,
  PoolShare,
} from '../types/schema'

const DEFAULT_DECIMALS = 18

export function handlePaused(event: Paused): void {
    changeXTokenState(event.address, true)
}

export function handleUnpaused(event: Unpaused): void {
    changeXTokenState(event.address, false)
}

function changeXTokenState(xTokenAddress: Address, xTokenState: boolean): void{
    let xTokenId = xTokenAddress.toHexString()
    let xToken = XToken.load(xTokenId)

    xToken.paused = xTokenState
    xToken.save()
}

export function handleTransfer(event: Transfer): void {
  let xTokenAddress = event.address.toHex()
  let xToken = XToken.load(xTokenAddress)
  let poolId = xToken.token
  log.debug('handleTransfer called for xtoken {} and token {}',[xTokenAddress, poolId])
  let pool = Pool.load(poolId)
  if(pool == null){
      log.debug('transfer on xtoken {}, token {} not handled because it doesnt correspond to a pool',[xTokenAddress, poolId])
      return
  }

  let ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  let isMint = event.params.from.toHex() == ZERO_ADDRESS
  let isBurn = event.params.to.toHex() == ZERO_ADDRESS
  if(isMint || isBurn) {
    log.debug('Transfer event from {} to {} from tx {} is a mint or burn',[
      event.params.from.toHex(),
      event.params.to.toHex(),
      event.transaction.hash.toHexString(),
    ])
  };

  let poolShareFromId = poolId.concat('-').concat(event.params.from.toHex())
  let poolShareFrom = PoolShare.load(poolShareFromId)
  let poolShareFromBalance = poolShareFrom == null ? ZERO_BD : poolShareFrom.balance

  let poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)
  let poolShareToBalance = poolShareTo == null ? ZERO_BD : poolShareTo.balance


  if (poolShareTo == null) {
    log.debug('creating poolShare with id: {} for liquidity provider {}, due to recipient of transfer event not having a pool share', [poolShareToId, event.params.to.toHex()])
    createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
    poolShareTo = PoolShare.load(poolShareToId)
  }
  poolShareTo.balance += tokenToDecimal(event.params.value.toBigDecimal(), 18)
  poolShareTo.save()

  if (poolShareFrom == null) {
    log.debug('creating poolShare with id: {} for liquidity provider {}, due to sender of transfer event not having a pool share', [poolShareFromId, event.params.from.toHex()])
    createPoolShareEntity(poolShareFromId, poolId, event.params.from.toHex())
    poolShareFrom = PoolShare.load(poolShareFromId)
  }
  poolShareFrom.balance -= tokenToDecimal(event.params.value.toBigDecimal(), 18)
  poolShareFrom.save()

  if (
    poolShareTo !== null
    && poolShareTo.balance.notEqual(ZERO_BD)
    && poolShareToBalance.equals(ZERO_BD)
  ) {
    pool.holdersCount += BigInt.fromI32(1)
  }

  if (
    poolShareFrom !== null
    && poolShareFrom.balance.equals(ZERO_BD)
    && poolShareFromBalance.notEqual(ZERO_BD)
  ) {
    pool.holdersCount -= BigInt.fromI32(1)
  }

  pool.save()
}
