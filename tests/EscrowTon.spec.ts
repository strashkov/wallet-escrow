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

        escrowTon = blockchain.openContract(
            EscrowTon.createFromConfig(
                {
                    escrowId: 0n,
                    publicKey: keyPair.publicKey,
                },
                code
            )
        );
    });

    it('should send msg', async () => {
        const initSenderBalance = toNano('3');
        const sender = await blockchain.treasury('sender', {
            balance: initSenderBalance,
        });
        const sentValue = toNano('2');
        const recipient = new Address(0, Buffer.alloc(32));
        const amount = toNano('1');

        await sender.send({
            to: escrowTon.address,
            value: sentValue,
            bounce: false,
        });

        const res = await escrowTon.sendMessage({
            secretKey: keyPair.secretKey,
            escrowId: 0n,
            recipient,
            amount,
            sendExcessTo: sender.address,
            timeoutAfter: Math.floor(Date.now() / 1000) + 60,
        });

        expect(res.transactions).toHaveTransaction({
            on: escrowTon.address,
            success: true,
            outMessagesCount: 2,
        });

        expect((await blockchain.getContract(recipient)).balance).toEqual(amount);

        const escrowContract = await blockchain.getContract(escrowTon.address);
        expect(escrowContract.accountState).not.toBeDefined();
        expect(fromNano(escrowContract.balance)).toEqual('0');

        const losses = initSenderBalance - (await sender.getBalance()) - amount;
        expect(losses).toBeGreaterThan(0);
        console.log('Losses:', fromNano(losses), 'TON');
    });
});
