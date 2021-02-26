import { Address } from '@graphprotocol/graph-ts'
import { RegisterToken } from '../types/XTokenWrapper/XTokenWrapper'
import { Token, XToken } from '../types/schema'

export function handleRegisterToken(event: RegisterToken): void {   
    let tokenId = event.params.token.toHex()
    let xTokenId = event.params.xToken.toHex()

    let token = Token.load(tokenId)
    let xToken = XToken.load(xTokenId)

    if (token == null) {
        token = new Token(tokenId)
    }
    if (xToken == null) {
        xToken = new XToken(xTokenId)
    }
    token.xToken = xTokenId
    xToken.token = tokenId

    token.save()
    xToken.save()

}
