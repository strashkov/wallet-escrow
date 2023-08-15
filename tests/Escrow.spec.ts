import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Escrow } from '../wrappers/Escrow';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { keyPairFromSeed, KeyPair } from 'ton-crypto';

describe('Escrow', () => {
    let code: Cell;
    let keyPair: KeyPair;

    beforeAll(async () => {
        code = await compile('Escrow');
        keyPair = keyPairFromSeed(Buffer.alloc(32));
    });

    let blockchain: Blockchain;
    let escrow: SandboxContract<Escrow>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        escrow = blockchain.openContract(Escrow.createFromConfig({
            publicKey: keyPair.publicKey,
            escrowId: 0n,
        }, code));
    });

    it('should send msg', async () => {
        const sender = await blockchain.treasury('sender');

        await sender.send({
            to: escrow.address,
            value: toNano('1'),
            bounce: false,
        });

        const res = await escrow.sendJettons({
            secretKey: keyPair.secretKey,
            escrowId: 0n,
            jettonWallet: new Address(0, Buffer.alloc(32)),
            jettonAmount: toNano('1'),
            jettonDestination: new Address(0, Buffer.alloc(32)),
            forwardAmount: toNano('0.01'),
            timeoutAfter: Math.floor(Date.now() / 1000) + 60,
        });

        expect(res.transactions).toHaveTransaction({
            on: escrow.address,
            success: true,
            outMessagesCount: 1,
        });
    });
});
