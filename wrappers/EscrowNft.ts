import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { sign } from 'ton-crypto';

export type EscrowNftConfig = {
    publicKey: Buffer,
    escrowId: bigint
};

export function escrowNftConfigToCell(config: EscrowNftConfig): Cell {
    return beginCell().storeBuffer(config.publicKey, 32).storeUint(config.escrowId, 64).endCell();
}

export class EscrowNft implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new EscrowNft(address);
    }

    static createFromConfig(config: EscrowNftConfig, code: Cell, workchain = 0) {
        const data = escrowNftConfigToCell(config);
        const init = { code, data };
        return new EscrowNft(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendNFT(provider: ContractProvider, params: {
        secretKey: Buffer,
        escrowId: bigint,
        nftAddress: Address,
        messageQueryId?: bigint | number,
        nftNewOwner: Address,
        sendExcessTo?: Address,
        customPayload?: Cell,
        forwardAmount: bigint,
        forwardPayload?: Cell,
        timeoutAfter: number,
    }) {
        const message = beginCell()
            .storeUint(params.escrowId, 64)
            .storeUint(params.timeoutAfter, 64)
            .storeAddress(params.nftAddress)
            .storeRef(beginCell()
                .storeUint(0x5fcc3d14, 32)
                .storeUint(params.messageQueryId ?? 0, 64)
                .storeAddress(params.nftNewOwner)
                .storeAddress(params.sendExcessTo)
                .storeMaybeRef(params.customPayload)
                .storeCoins(params.forwardAmount)
                .storeMaybeRef(params.forwardPayload))
            .endCell();
        const signature = sign(message.hash(), params.secretKey);
        await provider.external(beginCell().storeBuffer(signature, 64).storeSlice(message.beginParse()).endCell());
    }
}
