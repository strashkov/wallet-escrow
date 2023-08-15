import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { Address, TonClient4 } from 'ton';
import { keyPairFromSeed } from 'ton-crypto';
import { compile } from '@ton-community/blueprint';
import { EscrowNft } from '../wrappers/EscrowNft';

async function main() {
    const tc = new TonClient4({
        endpoint: await getHttpV4Endpoint({ network: 'testnet' }),
    });

    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = tc.open(EscrowNft.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('EscrowNft')));

    console.log(esc.address);

    await esc.sendNFT({
        secretKey: kp.secretKey,
        escrowId: 0n,
        nftAddress: Address.parse('EQD5okNcgJvtmYktqosnrGP5fLRETLuI8L1KUDtpFMBfZgJO'),
        nftNewOwner: Address.parse('EQCtalVAbHWYYt0cIwQ_1dGiNHl3Fe0bv0apijT_GZJR1CZh'),
        forwardAmount: 1n,
        timeoutAfter: Math.floor(Date.now() / 1000) + 60,
    });
}

main();
