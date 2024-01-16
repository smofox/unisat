import { UnspentOutput } from "./OrdTransaction";
export declare function createSendBTC({ utxos, toAddress, toAmount, wallet, network, changeAddress, receiverToPayFee, feeRate, pubkey, dump, enableRBF, }: {
    utxos: UnspentOutput[];
    toAddress: string;
    toAmount: number;
    wallet: any;
    network: any;
    changeAddress: string;
    receiverToPayFee?: boolean;
    feeRate?: number;
    pubkey: string;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<import("bitcoinjs-lib").Psbt>;
export declare function createSendOrd({ utxos, toAddress, toOrdId, wallet, network, changeAddress, pubkey, feeRate, outputValue, dump, enableRBF, }: {
    utxos: UnspentOutput[];
    toAddress: string;
    toOrdId: string;
    wallet: any;
    network: any;
    changeAddress: string;
    pubkey: string;
    feeRate?: number;
    outputValue: number;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<import("bitcoinjs-lib").Psbt>;
export declare function createSendMultiOrds({ utxos, toAddress, toOrdIds, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF, }: {
    utxos: UnspentOutput[];
    toAddress: string;
    toOrdIds: string[];
    wallet: any;
    network: any;
    changeAddress: string;
    pubkey: string;
    feeRate?: number;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<import("bitcoinjs-lib").Psbt>;
export declare function createSendMultiBTC({ utxos, receivers, wallet, network, changeAddress, feeRate, pubkey, dump, enableRBF, }: {
    utxos: UnspentOutput[];
    receivers: {
        address: string;
        amount: number;
    }[];
    wallet: any;
    network: any;
    changeAddress: string;
    feeRate?: number;
    pubkey: string;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<import("bitcoinjs-lib").Psbt>;
export declare function createSplitOrdUtxo({ utxos, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF, outputValue, }: {
    utxos: UnspentOutput[];
    wallet: any;
    network: any;
    changeAddress: string;
    pubkey: string;
    feeRate?: number;
    dump?: boolean;
    enableRBF?: boolean;
    outputValue?: number;
}): Promise<import("bitcoinjs-lib").Psbt>;
export declare function createSplitOrdUtxoV2({ utxos, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF, outputValue, }: {
    utxos: UnspentOutput[];
    wallet: any;
    network: any;
    changeAddress: string;
    pubkey: string;
    feeRate?: number;
    dump?: boolean;
    enableRBF?: boolean;
    outputValue?: number;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    splitedCount: number;
}>;
