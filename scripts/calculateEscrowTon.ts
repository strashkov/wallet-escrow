import { keyPairFromSeed } from 'ton-crypto';
import { EscrowTon } from '../wrappers/EscrowTon';
import { compile } from '@ton-community/blueprint';

async function main() {
    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = EscrowTon.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('EscrowTon'));

    console.log(esc.address);
}

main();
