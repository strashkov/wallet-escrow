import { keyPairFromSeed } from 'ton-crypto';
import { Escrow } from '../wrappers/Escrow';
import { compile } from '@ton-community/blueprint';

async function main() {
    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = Escrow.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('Escrow'));

    console.log(esc.address);
}

main();
