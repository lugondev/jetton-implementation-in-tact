import { beginCell, contractAddress, fromNano, internal, toNano, TonClient4, WalletContractV4 } from "@ton/ton";
import * as dotenv from "dotenv";
import { mnemonicToPrivateKey } from "ton-crypto";
import { SampleJetton, storeMint } from "./output/SampleJetton_SampleJetton";
import { buildOnchainMetadata } from "./utils/jetton-helpers";

import { printSeparator } from "./utils/print";

dotenv.config();

(async () => {
    //create client for testnet sandboxv4 API - alternative endpoint
    const client4 = new TonClient4({
        // endpoint: "https://sandbox-v4.tonhubapi.com",
        endpoint: "https://mainnet-v4.tonhubapi.com"
    });

    let mnemonics = (process.env.mnemonics_2 || "").toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    let secretKey = keyPair.secretKey;
    let workchain = 0; //we are working in basechain.
    let deployer_wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });

    let deployer_wallet_contract = client4.open(deployer_wallet);

    const jettonParams = {
        name: "Test Jetton Token",
        description: "This is Test Jetton Token in Tact-lang",
        symbol: "TJT",
        image: "https://avatars.githubusercontent.com/u/104382459?s=200&v=4"
    };

    // Create content Cell
    let content = buildOnchainMetadata(jettonParams);
    let max_supply = toNano(21000000); // 🔴 Set the specific total supply in nano

    // Compute init data for deployment
    // NOTICE: the parameters inside the init functions were the input for the contract address
    // which means any changes will change the smart contract address as well
    let init = await SampleJetton.init(deployer_wallet_contract.address, content, max_supply);
    let jettonMaster = contractAddress(workchain, init);
    let deployAmount = toNano("0.15");

    let supply = toNano(1000000000); // 🔴 Specify total supply in nano
    let packed_msg = beginCell()
        .store(
            storeMint({
                $$type: "Mint",
                amount: supply,
                receiver: deployer_wallet_contract.address
            })
        )
        .endCell();

    // send a message on new address contract to deploy it
    let seqno: number = await deployer_wallet_contract.getSeqno();
    console.log("🛠️Preparing new outgoing massage from deployment wallet. \n" + deployer_wallet_contract.address);
    console.log("Seqno: ", seqno + "\n");
    printSeparator();

    // Get deployment wallet balance
    let balance: bigint = await deployer_wallet_contract.getBalance();

    console.log("Current deployment wallet balance = ", fromNano(balance).toString(), "💎TON");
    console.log("Minting:: ", fromNano(supply));
    printSeparator();

    await deployer_wallet_contract.sendTransfer({
        seqno,
        secretKey,
        messages: [
            internal({
                to: jettonMaster,
                value: deployAmount,
                init: {
                    code: init.code,
                    data: init.data
                },
                body: packed_msg
            })
        ]
    });
    console.log("====== Deployment message sent to =======\n", jettonMaster);
})();
