import { RegisterToken } from '../types/XTokenWrapper/XTokenWrapper'
import { Token, XToken } from '../types/schema'
import { ERC20 } from '../types/XTokenWrapper/ERC20'
import { Address } from '@graphprotocol/graph-ts'

const DEFAULT_DECIMALS = 18

export function handleRegisterToken(event: RegisterToken): void {   
    let tokenId = event.params.token.toHex()
    let xTokenId = event.params.xToken.toHex()

    let token = Token.load(tokenId)
    let xToken = XToken.load(xTokenId)

    if (token == null) {
        token = new Token(tokenId)
        let erc20Token = ERC20.bind(event.params.token)
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
        let erc20Token = ERC20.bind(event.params.xToken)
        let tokenDecimals = erc20Token.try_decimals()
        let tokenName = erc20Token.try_name()
        let tokenSymbol = erc20Token.try_symbol()
        xToken.decimals = !tokenDecimals.reverted
            ? tokenDecimals.value
            : DEFAULT_DECIMALS
        xToken.name = !tokenName.reverted ? tokenName.value : ""
        xToken.symbol = !tokenSymbol.reverted ? tokenSymbol.value : ""
    }

    xToken.token = tokenId

    token.save()
    xToken.save()
}

