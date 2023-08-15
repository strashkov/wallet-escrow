import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { Address, TonClient4 } from 'ton';
import { keyPairFromSeed } from 'ton-crypto';
import { Escrow } from '../wrappers/Escrow';
import { compile } from '@ton-community/blueprint';

async function main() {
    const tc = new TonClient4({
        endpoint: await getHttpV4Endpoint({ network: 'testnet' }),
    });

    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = tc.open(Escrow.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('Escrow')));

    console.log(esc.address);

    await esc.sendJettons({
        secretKey: kp.secretKey,
        escrowId: 0n,
        jettonWallet: Address.parse('EQCaG_gGM8HN3dPb3ZHKFLpu5Wxk_nRVOv98od8jarNep6aD'),
        jettonAmount: 1n,
        jettonDestination: Address.parse('EQCtalVAbHWYYt0cIwQ_1dGiNHl3Fe0bv0apijT_GZJR1CZh'),
        forwardAmount: 1n,
        timeoutAfter: Math.floor(Date.now() / 1000) + 60,
    });
}

main();
