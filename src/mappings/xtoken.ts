import {  XToken } from '../types/schema'
import { Paused, Unpaused, Transfer, XToken as XTokenAbi } from '../types/templates/XToken/XToken'
import { Address, log, store, BigInt } from '@graphprotocol/graph-ts'
import { ZERO_BD, tokenToDecimal, createPoolShareEntity } from './helpers'
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
  let value = event.params.value.toBigDecimal()

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
    let xTokenContract = XTokenAbi.bind(Address.fromString(xTokenAddress))
    pool.totalShares = tokenToDecimal(xTokenContract.totalSupply().toBigDecimal(), 18)
  }

  let poolShareFromId = poolId.concat('-').concat(event.params.from.toHex())
  let poolShareFrom = PoolShare.load(poolShareFromId)

  let poolShareToId = poolId.concat('-').concat(event.params.to.toHex())
  let poolShareTo = PoolShare.load(poolShareToId)


  if(!isMint){
    if (poolShareFrom == null) {
      log.critical('sender of transfer : {} does not have a pool share', [event.params.from.toHex()])
    }
    poolShareFrom.balance -= tokenToDecimal(value, 18)
    poolShareFrom.save()
    if(poolShareFrom.balance.equals(ZERO_BD)){
      store.remove('PoolShare', poolShareFrom.id)
      
      let holders = pool.holders || []
      let index = holders.indexOf(event.params.to.toHex())
      holders.splice(index, 1)
    }
  }
  if(!isBurn){
    if (poolShareTo == null) {
      log.debug('creating poolShare with id: {} for liquidity provider {}, due to recipient of transfer event not having a pool share', [poolShareToId, event.params.to.toHex()])
      createPoolShareEntity(poolShareToId, poolId, event.params.to.toHex())
      poolShareTo = PoolShare.load(poolShareToId)

      if (pool.holders.indexOf(event.params.to.toHex()) == -1) {
        pool.holders.push(event.params.to.toHex())
      }
    }
    poolShareTo.balance += tokenToDecimal(value, 18)
    poolShareTo.save()
  }

  pool.holdersCount = BigInt.fromI32(pool.holders.length)

  pool.save()
}
