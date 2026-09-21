/**
 * Cookie Chain Treasury Payout Dispatcher
 * Signs and broadcasts on-chain native $COOKIE transfers from the Treasury Keypair
 * directly to user wallets on Cookie Chain SVM (https://rpc.cookiescan.io).
 */

const fs = require('fs');
const path = require('path');
const solana = require('../frontend/node_modules/@solana/web3.js');

const RPC_ENDPOINT = process.env.COOKIE_RPC_URL || 'https://rpc.cookiescan.io';
const DEFAULT_KEYPAIR_PATH = process.env.TREASURY_KEYPAIR_PATH || path.join(__dirname, '..', 'config', 'treasury_vault_keypair.json');

async function dispatchPayout(recipientAddress, amountCookie, memoText = "") {
    if (!recipientAddress) {
        throw new Error("Missing recipient address");
    }
    if (!amountCookie || amountCookie <= 0) {
        throw new Error(`Invalid payout amount: ${amountCookie}`);
    }

    // 1. Load Treasury Keypair
    if (!fs.existsSync(DEFAULT_KEYPAIR_PATH)) {
        throw new Error(`Treasury keypair file not found at: ${DEFAULT_KEYPAIR_PATH}`);
    }
    const keypairRaw = JSON.parse(fs.readFileSync(DEFAULT_KEYPAIR_PATH, 'utf-8'));
    const treasuryKeypair = solana.Keypair.fromSecretKey(Uint8Array.from(keypairRaw));
    const treasuryPubkey = treasuryKeypair.publicKey;

    // 2. Connect to Cookie Chain SVM RPC
    const connection = new solana.Connection(RPC_ENDPOINT, 'confirmed');

    // 3. Verify Treasury balance
    const treasuryBalanceLamports = await connection.getBalance(treasuryPubkey, 'confirmed');
    const lamportsToSend = Math.floor(amountCookie * 1e9);

    if (treasuryBalanceLamports < lamportsToSend + 10000) {
        throw new Error(
            `Insufficient Treasury balance. Required: ${amountCookie} COOKIE (${lamportsToSend} lamports) + fee, available: ${treasuryBalanceLamports / 1e9} COOKIE`
        );
    }

    const recipientPubkey = new solana.PublicKey(recipientAddress);

    // 4. Build Transaction
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const tx = new solana.Transaction();
    tx.recentBlockhash = blockhash;
    tx.feePayer = treasuryPubkey;

    // Compute Budget: Standard low priority fee for Cookie Chain
    tx.add(solana.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }));
    tx.add(solana.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }));

    // Native $COOKIE Transfer
    tx.add(solana.SystemProgram.transfer({
        fromPubkey: treasuryPubkey,
        toPubkey: recipientPubkey,
        lamports: lamportsToSend
    }));

    // Optional on-chain memo
    if (memoText) {
        const memoProgramId = new solana.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        tx.add(new solana.TransactionInstruction({
            keys: [{ pubkey: treasuryPubkey, isSigner: true, isWritable: true }],
            programId: memoProgramId,
            data: Buffer.from(memoText.slice(0, 120))
        }));
    }

    // 5. Sign and Send
    tx.sign(treasuryKeypair);
    const rawTx = tx.serialize();
    const txSig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
    });

    // 6. Confirm transaction
    const confirmation = await connection.confirmTransaction({
        signature: txSig,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight
    }, 'confirmed');

    const slot = await connection.getSlot('confirmed');

    return {
        success: true,
        network: "Cookie Chain SVM Mainnet",
        tx_signature: txSig,
        cookiescan_url: `https://cookiescan.io/tx/${txSig}`,
        treasury_address: treasuryPubkey.toBase58(),
        recipient_address: recipientAddress,
        amount_cookie: amountCookie,
        lamports_sent: lamportsToSend,
        slot: slot,
        confirmation_error: confirmation.value ? confirmation.value.err : null
    };
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    let to = "";
    let amount = 0.0;
    let memo = "";

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--to' && args[i+1]) {
            to = args[i+1];
            i++;
        } else if (args[i] === '--amount' && args[i+1]) {
            amount = parseFloat(args[i+1]);
            i++;
        } else if (args[i] === '--memo' && args[i+1]) {
            memo = args[i+1];
            i++;
        }
    }

    if (!to || amount <= 0) {
        console.error(JSON.stringify({
            success: false,
            error: "Usage: node dispatch_treasury_payout.js --to <ADDRESS> --amount <COOKIE_AMOUNT> [--memo <MEMO>]"
        }));
        process.exit(1);
    }

    dispatchPayout(to, amount, memo)
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(err => {
            console.error(JSON.stringify({ success: false, error: err.message }));
            process.exit(1);
        });
}

module.exports = { dispatchPayout };
