import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { Address, Cell, TonClient4 } from 'ton';
import { keyPairFromSeed } from 'ton-crypto';
import { compile } from '@ton-community/blueprint';
import { EscrowTon } from '../wrappers/EscrowTon';

async function main() {
    const tc = new TonClient4({
        endpoint: await getHttpV4Endpoint({ network: 'testnet' }),
    });

    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = tc.open(EscrowTon.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('EscrowTon')));

    console.log(esc.address);

    await esc.sendMessage({
        secretKey: kp.secretKey,
        escrowId: 0n,
        recipient: Address.parse('EQCtalVAbHWYYt0cIwQ_1dGiNHl3Fe0bv0apijT_GZJR1CZh'),
        timeoutAfter: Math.floor(Date.now() / 1000) + 60,
        message: new Cell(),
    });
}

main();
