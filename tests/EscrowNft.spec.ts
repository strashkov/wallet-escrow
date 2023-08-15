import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { EscrowNft } from '../wrappers/EscrowNft';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { KeyPair, keyPairFromSeed } from 'ton-crypto';

describe('EscrowNft', () => {
    let code: Cell;
    let keyPair: KeyPair;

    beforeAll(async () => {
        code = await compile('EscrowNft');
        keyPair = keyPairFromSeed(Buffer.alloc(32));
    });

    let blockchain: Blockchain;
    let escrowNft: SandboxContract<EscrowNft>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        escrowNft = blockchain.openContract(EscrowNft.createFromConfig({
            publicKey: keyPair.publicKey,
            escrowId: 0n,
        }, code));
    });

    it('should send msg', async () => {
        const sender = await blockchain.treasury('sender');

        await sender.send({
            to: escrowNft.address,
            value: toNano('1'),
            bounce: false,
        });

        const res = await escrowNft.sendNFT({
            secretKey: keyPair.secretKey,
            escrowId: 0n,
            nftAddress: new Address(0, Buffer.alloc(32)),
            nftNewOwner: new Address(0, Buffer.alloc(32)),
            forwardAmount: toNano('0.01'),
            timeoutAfter: Math.floor(Date.now() / 1000) + 60,
        });

        expect(res.transactions).toHaveTransaction({
            on: escrowNft.address,
            success: true,
            outMessagesCount: 1,
        });
    });
});
