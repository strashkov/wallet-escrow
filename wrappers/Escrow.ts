import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { sign } from 'ton-crypto';

export type EscrowConfig = {
    publicKey: Buffer,
    escrowId: bigint
};

export function escrowConfigToCell(config: EscrowConfig): Cell {
    return beginCell().storeBuffer(config.publicKey, 32).storeUint(config.escrowId, 64).endCell();
}

export class Escrow implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Escrow(address);
    }

    static createFromConfig(config: EscrowConfig, code: Cell, workchain = 0) {
        const data = escrowConfigToCell(config);
        const init = { code, data };
        return new Escrow(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendJettons(provider: ContractProvider, params: {
        secretKey: Buffer,
        escrowId: bigint,
        jettonWallet: Address,
        messageQueryId?: bigint | number,
        jettonAmount: bigint,
        jettonDestination: Address,
        sendExcessTo?: Address,
        customPayload?: Cell,
        forwardAmount: bigint,
        forwardPayload?: Cell,
        timeoutAfter: number,
    }) {
        const message = beginCell()
            .storeUint(params.escrowId, 64)
            .storeUint(params.timeoutAfter, 64)
            .storeAddress(params.jettonWallet)
            .storeRef(beginCell()
                .storeUint(0x0f8a7ea5, 32)
                .storeUint(params.messageQueryId ?? 0, 64)
                .storeCoins(params.jettonAmount)
                .storeAddress(params.jettonDestination)
                .storeAddress(params.sendExcessTo)
                .storeMaybeRef(params.customPayload)
                .storeCoins(params.forwardAmount)
                .storeMaybeRef(params.forwardPayload))
            .endCell();
        const signature = sign(message.hash(), params.secretKey);
        await provider.external(beginCell().storeBuffer(signature, 64).storeSlice(message.beginParse()).endCell());
    }
}
