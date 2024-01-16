/// <reference types="node" />
import * as bitcoin from "bitcoinjs-lib";
declare enum AddressType {
    P2PKH = 0,
    SEGWIT = 1,
    TAPROOT = 2
}
interface ScryptKDFParamsOut {
    dklen: number;
    n: number;
    p: number;
    r: number;
    salt: string;
}
interface PBKDFParamsOut {
    c: number;
    dklen: number;
    prf: string;
    salt: string;
}
declare type KDFParamsOut = ScryptKDFParamsOut | PBKDFParamsOut;
interface V3Keystore {
    crypto: {
        cipher: string;
        cipherparams: {
            iv: string;
        };
        ciphertext: string;
        kdf: string;
        kdfparams: KDFParamsOut;
        mac: string;
    };
    id: string;
    version: number;
}
interface V3Params {
    kdf: string;
    cipher: string;
    salt: string | Buffer;
    iv: string | Buffer;
    uuid: string | Buffer;
    dklen: number;
    c: number;
    n: number;
    r: number;
    p: number;
}
export declare class Wallet {
    private readonly keyPair;
    private privateKey;
    private publicKey;
    network: bitcoin.Network;
    constructor(privateKey?: Buffer, publicKey?: Buffer, network?: bitcoin.Network);
    /**
     * Create an instance based on a new random key.
     *
     */
    static generate(network?: bitcoin.Network): Wallet;
    /**
     * Create an instance where the address is valid against the supplied pattern (**this will be very slow**)
     */
    /**
     * Create an instance based on a public key (certain methods will not be available)
     *
     * This method only accepts uncompressed Ethereum-style public keys, unless
     * the `nonStrict` flag is set to true.
     */
    static fromPublicKey(publicKey: Buffer): Wallet;
    /**
     * Create an instance based on a raw private key
     */
    static fromPrivateKey(privateKey: Buffer): Wallet;
    /**
     * Import a wallet (Version 3 of the Ethereum wallet format). Set `nonStrict` true to accept files with mixed-caps.
     *
     * @param input A JSON serialized string, or an object representing V3 Keystore.
     * @param password The keystore password.
     */
    static fromV3(input: string | V3Keystore, password: string): Promise<Wallet>;
    /**
     * Returns the wallet's public key.
     */
    private get pubKey();
    /**
     * Returns the wallet's private key.
     */
    private get privKey();
    /**
     * Returns the wallet's private key.
     *
     */
    getPrivateKey(): Buffer;
    getPrivateKeyString(): string;
    /**
     * Returns the wallet's public key.
     */
    getPublicKey(): Buffer;
    /**
     * Returns the wallet's public key as a "0x" prefixed hex string
     */
    getPublicKeyString(): string;
    /**
     * Returns the wallet's address.
     */
    getAddress(type?: AddressType, network?: bitcoin.Network): string;
    /**
     * Returns the wallet's address as a "0x" prefixed hex string
     */
    getAddressString(type?: AddressType, network?: bitcoin.Network): string;
    /**
     * Returns an Etherem Version 3 Keystore Format object representing the wallet
     *
     * @param password The password used to encrypt the Keystore.
     * @param opts The options for the keystore. See [its spec](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition) for more info.
     */
    toV3(password: string, opts?: Partial<V3Params>): Promise<V3Keystore>;
    /**
     * Return the suggested filename for V3 keystores.
     */
    getV3Filename(timestamp?: number): string;
    toV3String(password: string, opts?: Partial<V3Params>): Promise<string>;
}
export {};
