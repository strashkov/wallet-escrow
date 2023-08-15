import { keyPairFromSeed } from 'ton-crypto';
import { EscrowNft } from '../wrappers/EscrowNft';
import { compile } from '@ton-community/blueprint';

async function main() {
    const kp = keyPairFromSeed(Buffer.alloc(32));

    const esc = EscrowNft.createFromConfig({
        publicKey: kp.publicKey,
        escrowId: 0n,
    }, await compile('EscrowNft'));

    console.log(esc.address);
}

main();
