import { prepareTactDeployment } from "@tact-lang/deployer";
import { Address, contractAddress } from "@ton/core";
import { toNano } from "@ton/ton";
import * as fs from "fs";
import * as path from "path";
import { SampleJetton } from "./output/SampleJetton_SampleJetton";
import { buildOnchainMetadata } from "./utils/jetton-helpers";

(async () => {
    // Parameters
    let testnet = true;
    let packageName = "SampleJetton_SampleJetton.pkg";
    const jettonParams = {
        name: "Test Jetton Token",
        description: "This is Test Jetton Token in Tact-lang",
        symbol: "TJT",
        image: "https://avatars.githubusercontent.com/u/104382459?s=200&v=4"
    };
    let content = buildOnchainMetadata(jettonParams);
    let max_supply = toNano(21000000); // 🔴 Set the specific total supply in nano
    let init = await SampleJetton.init(
        Address.parse("0QBEpk9u4aC5bzJ9E35pQe-sMOkbpVhvOK-Bz6Zy33TCd-oY"),
        content,
        max_supply
    );

    // Load required data
    let address = contractAddress(0, init);
    let data = init.data.toBoc();
    let pkg = fs.readFileSync(path.resolve(__dirname, "output", packageName));

    // Prepareing
    console.log("Uploading package...");
    let prepare = await prepareTactDeployment({ pkg, data, testnet });

    // Deploying
    console.log("============================================================================================");
    console.log("Contract Address");
    console.log("============================================================================================");
    console.log();
    console.log(address.toString({ testOnly: testnet }));
    console.log();
    console.log("============================================================================================");
    console.log("Please, follow deployment link");
    console.log("============================================================================================");
    console.log();
    console.log(prepare);
    console.log();
    console.log("============================================================================================");
})();
