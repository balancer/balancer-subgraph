import { RegisterToken } from '../types/XTokenWrapper/XTokenWrapper'
import { Token, XToken } from '../types/schema'
import { ERC20 } from '../types/XTokenWrapper/ERC20'
import { XToken as XTokenAbi } from '../types/templates'
import { log } from '@graphprotocol/graph-ts'

const DEFAULT_DECIMALS = 18

export function handleRegisterToken(event: RegisterToken): void {   
    let tokenIdAddress = event.params.token
    let xTokenIdAddress = event.params.xToken
    let tokenId = tokenIdAddress.toHex()
    let xTokenId = xTokenIdAddress.toHex()
    log.debug('calling handleRegisterToken for token:{} and xtoken: {}',[tokenId, xTokenId])


    // skip misconfigured pool on mainnet
    if(tokenId == '0x8c4167154accd56797d122d8bcaad3a9432ed4af'){
        return
    }
    if(xTokenId == '0xdde53eff3632ed4820c41ffe66cd32a42aba3899' || xTokenId == '0x71b3c05afc180e528529e0c026501e606118894c'){
        return
    }

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
    token.xToken = xTokenId
    XTokenAbi.create(xTokenIdAddress)

    token.save()
    xToken.save()
}
