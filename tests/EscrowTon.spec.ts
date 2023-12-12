import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, fromNano, toNano } from 'ton-core';
import { EscrowTon } from '../wrappers/EscrowTon';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, keyPairFromSeed } from 'ton-crypto';

describe('EscrowTon', () => {
    let code: Cell;
    let keyPair: KeyPair;

    beforeAll(async () => {
        code = await compile('EscrowTon');
        keyPair = keyPairFromSeed(Buffer.alloc(32));
    });

    let blockchain: Blockchain;
    let escrowTon: SandboxContract<EscrowTon>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        escrowTon = blockchain.openContract(EscrowTon.createFromConfig({
            escrowId: 0n,
            publicKey: keyPair.publicKey,
        }, code));
    });

    it('should send msg', async () => {
        const sender = await blockchain.treasury('sender');

        const initValue = toNano('1');
        const recipient = new Address(0, Buffer.alloc(32));

        await sender.send({
            to: escrowTon.address,
            value: initValue,
            bounce: false,
        });

        const res = await escrowTon.sendMessage({
            secretKey: keyPair.secretKey,
            escrowId: 0n,
            recipient,
            timeoutAfter: Math.floor(Date.now() / 1000) + 60,
            message: new Cell(),
        });

        expect(res.transactions).toHaveTransaction({
            on: escrowTon.address,
            success: true,
            outMessagesCount: 1,
        });

        console.log('Losses:', fromNano(initValue - (await blockchain.getContract(recipient)).balance), 'TON');
    });
});
