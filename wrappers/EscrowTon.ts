import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import { sign } from 'ton-crypto';

export type EscrowTonConfig = {
    publicKey: Buffer,
    escrowId: bigint
};

export function escrowTonConfigToCell(config: EscrowTonConfig): Cell {
    return beginCell().storeBuffer(config.publicKey, 32).storeUint(config.escrowId, 64).endCell();
}

export class EscrowTon implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new EscrowTon(address);
    }

    static createFromConfig(config: EscrowTonConfig, code: Cell, workchain = 0) {
        const data = escrowTonConfigToCell(config);
        const init = { code, data };
        return new EscrowTon(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMessage(provider: ContractProvider, params: {
        secretKey: Buffer,
        escrowId: bigint,
        recipient: Address,
        message: Cell,
        timeoutAfter: number,
    }) {
        const message = beginCell()
            .storeUint(params.escrowId, 64)
            .storeUint(params.timeoutAfter, 64)
            .storeAddress(params.recipient)
            .storeRef(params.message)
            .endCell();
        const signature = sign(message.hash(), params.secretKey);
        await provider.external(beginCell().storeBuffer(signature, 64).storeSlice(message.beginParse()).endCell());
    }
}
