import {
    JoinPool,
    ExitPool
} from '../types/BPoolProxy/BPoolProxy'

import {
    PoolShare,
} from '../types/schema'

import {
    createPoolShareEntity, 
    tokenToDecimal,
    ZERO_BD 
} from './helpers'

export function handleJoinPool(event: JoinPool): void {
    let bpool = event.params.bpool
    let lp = event.params.liquidityProvider
    let shares = event.params.shares

    let bpoolId = bpool.toHex()
    let lpId = lp.toHex()
    let poolShareId = bpoolId.concat('-').concat(lpId)

    let poolShare = PoolShare.load(poolShareId)
    
    let poolShareBalance = poolShare == null ? ZERO_BD : poolShare.balance

    if (poolShare == null) {
        createPoolShareEntity(poolShareId, bpoolId, lpId)
        poolShare = PoolShare.load(poolShareId)
    }
    
    poolShare.balance += tokenToDecimal(shares.toBigDecimal(), 18)
    poolShare.save()
}

export function handleExitPool(event: ExitPool): void {
    let bpool = event.params.bpool
    let lp = event.params.iquidityProvider
    let shares = event.params.shares

    let bpoolId = bpool.toHex()
    let lpId = lp.toHex()
    let poolShareId = bpoolId.concat('-').concat(lpId)

    let poolShare = PoolShare.load(poolShareId)
    let poolShareBalance = poolShare.balance

    poolShare.balance -= tokenToDecimal(shares.toBigDecimal(), 18)
    poolShare.save()
}
