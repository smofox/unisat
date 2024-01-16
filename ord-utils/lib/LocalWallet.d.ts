import * as bitcoin from "bitcoinjs-lib";
import { ECPairInterface } from "ecpair";
import { AddressType } from "./OrdTransaction";
export declare const toXOnly: (pubKey: Buffer) => Buffer;
export declare enum NetworkType {
    MAINNET = 0,
    TESTNET = 1
}
export declare function toPsbtNetwork(networkType: NetworkType): bitcoin.networks.Network;
export declare function publicKeyToPayment(publicKey: string, type: AddressType, networkType: NetworkType): bitcoin.payments.Payment;
export declare function publicKeyToAddress(publicKey: string, type: AddressType, networkType: NetworkType): string;
export declare function publicKeyToScriptPk(publicKey: string, type: AddressType, networkType: NetworkType): string;
export interface ToSignInput {
    index: number;
    publicKey: string;
    sighashTypes?: number[];
}
export interface SignOptions {
    inputs?: ToSignInput[];
    autoFinalized?: boolean;
}
export declare function randomWIF(networkType?: NetworkType): string;
export declare class LocalWallet {
    keyPair: ECPairInterface;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    constructor(wif: string, networkType?: NetworkType, addressType?: AddressType);
    signPsbt(psbt: bitcoin.Psbt, opts?: SignOptions): Promise<bitcoin.Psbt>;
    getPublicKey(): string;
}
