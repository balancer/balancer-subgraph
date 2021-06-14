import { RegisterToken } from '../types/XTokenWrapper/XTokenWrapper'
import { Token, XToken } from '../types/schema'
import { ERC20 } from '../types/XTokenWrapper/ERC20'
import { Paused, Unpaused } from '../types/templates/XToken/XToken'
import { XToken as XTokenAbi } from '../types/templates'
import { Address } from '@graphprotocol/graph-ts'

const DEFAULT_DECIMALS = 18

export function handleRegisterToken(event: RegisterToken): void {   
    let tokenIdAddress = event.params.token
    let xTokenIdAddress = event.params.xToken
    let tokenId = tokenIdAddress.toHex()
    let xTokenId = xTokenIdAddress.toHex()
    log.debug('calling handleRegisterToken for token:{} and xtoken: {}',[tokenId, xTokenId])

    let token = Token.load(tokenId)
    let xToken = XToken.load(xTokenId)

    if (token == null) {
        token = new Token(tokenId)
        let erc20Token = ERC20.bind(tokenIdAddress)
        let tokenDecimals = erc20Token.try_decimals()
        let tokenName = erc20Token.try_name()
        let tokenSymbol = erc20Token.try_symbol()
        token.decimals = !tokenDecimals.reverted
            ? tokenDecimals.value
            : DEFAULT_DECIMALS
        token.name = !tokenName.reverted ? tokenName.value : ""
        token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : ""
    }

    if (xToken == null) {
        xToken = new XToken(xTokenId)
    }
    let erc20Token = ERC20.bind(xTokenIdAddress)
    let tokenDecimals = erc20Token.try_decimals()
    let tokenName = erc20Token.try_name()
    let tokenSymbol = erc20Token.try_symbol()
    xToken.decimals = !tokenDecimals.reverted
        ? tokenDecimals.value
        : DEFAULT_DECIMALS
    xToken.name = !tokenName.reverted ? tokenName.value : ""
    xToken.symbol = !tokenSymbol.reverted ? tokenSymbol.value : ""
    xToken.paused = false

    xToken.token = tokenId
    XTokenAbi.create(xTokenIdAddress)

    token.save()
    xToken.save()
}

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
