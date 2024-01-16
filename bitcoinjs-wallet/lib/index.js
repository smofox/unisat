"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const crypto = __importStar(require("crypto"));
const randombytes_1 = __importDefault(require("randombytes"));
const scrypt_js_1 = require("scrypt-js");
const uuid_1 = require("uuid");
const ecpair_1 = __importDefault(require("ecpair"));
const ecc = __importStar(require("tiny-secp256k1"));
const createHash = require("create-hash");
bitcoin.initEccLib(ecc);
const ECPair = (0, ecpair_1.default)(ecc);
const uuidv4 = uuid_1.v4;
var AddressType;
(function (AddressType) {
    AddressType[AddressType["P2PKH"] = 0] = "P2PKH";
    AddressType[AddressType["SEGWIT"] = 1] = "SEGWIT";
    AddressType[AddressType["TAPROOT"] = 2] = "TAPROOT";
})(AddressType || (AddressType = {}));
function validateHexString(paramName, str, length) {
    if (str.toLowerCase().startsWith("0x")) {
        str = str.slice(2);
    }
    if (!str && !length) {
        return str;
    }
    if (length % 2) {
        throw new Error(`Invalid length argument, must be an even number`);
    }
    if (typeof length === "number" && str.length !== length) {
        throw new Error(`Invalid ${paramName}, string must be ${length} hex characters`);
    }
    if (!/^([0-9a-f]{2})+$/i.test(str)) {
        const howMany = typeof length === "number"
            ? length
            : "empty or a non-zero even number of";
        throw new Error(`Invalid ${paramName}, string must be ${howMany} hex characters`);
    }
    return str;
}
function validateBuffer(paramName, buff, length) {
    if (!Buffer.isBuffer(buff)) {
        const howManyHex = typeof length === "number"
            ? `${length * 2}`
            : "empty or a non-zero even number of";
        const howManyBytes = typeof length === "number" ? ` (${length} bytes)` : "";
        throw new Error(`Invalid ${paramName}, must be a string (${howManyHex} hex characters) or buffer${howManyBytes}`);
    }
    if (typeof length === "number" && buff.length !== length) {
        throw new Error(`Invalid ${paramName}, buffer must be ${length} bytes`);
    }
    return buff;
}
function mergeToV3ParamsWithDefaults(params) {
    const v3Defaults = {
        cipher: "aes-128-ctr",
        kdf: "scrypt",
        salt: (0, randombytes_1.default)(32),
        iv: (0, randombytes_1.default)(16),
        uuid: (0, randombytes_1.default)(16),
        dklen: 32,
        c: 262144,
        n: 262144,
        r: 8,
        p: 1,
    };
    if (!params) {
        return v3Defaults;
    }
    if (typeof params.salt === "string") {
        params.salt = Buffer.from(validateHexString("salt", params.salt), "hex");
    }
    if (typeof params.iv === "string") {
        params.iv = Buffer.from(validateHexString("iv", params.iv, 32), "hex");
    }
    if (typeof params.uuid === "string") {
        params.uuid = Buffer.from(validateHexString("uuid", params.uuid, 32), "hex");
    }
    if (params.salt) {
        validateBuffer("salt", params.salt);
    }
    if (params.iv) {
        validateBuffer("iv", params.iv, 16);
    }
    if (params.uuid) {
        validateBuffer("uuid", params.uuid, 16);
    }
    return Object.assign(Object.assign({}, v3Defaults), params);
}
function kdfParamsForPBKDF(opts) {
    return {
        dklen: opts.dklen,
        salt: opts.salt,
        c: opts.c,
        prf: "hmac-sha256",
    };
}
function kdfParamsForScrypt(opts) {
    return {
        dklen: opts.dklen,
        salt: opts.salt,
        n: opts.n,
        r: opts.r,
        p: opts.p,
    };
}
class Wallet {
    constructor(privateKey, publicKey, network) {
        this.network = bitcoin.networks.bitcoin;
        this.network = network;
        if (privateKey && publicKey) {
            throw new Error("Cannot supply both a private and a public key to the constructor");
        }
        if (privateKey) {
            this.keyPair = ECPair.fromPrivateKey(privateKey);
            this.privateKey = privateKey;
            this.publicKey = this.keyPair.publicKey;
        }
        if (publicKey) {
            this.publicKey = publicKey;
            this.keyPair = ECPair.fromPublicKey(publicKey);
        }
    }
    // static methods
    /**
     * Create an instance based on a new random key.
     *
     */
    static generate(network) {
        const keyPair = ECPair.makeRandom({ network });
        return new Wallet(keyPair.privateKey);
    }
    /**
     * Create an instance where the address is valid against the supplied pattern (**this will be very slow**)
     */
    // public static generateVanityAddress(
    //   pattern: RegExp | string,
    //   network: bitcoin.Network
    // ): Wallet {
    //   if (!(pattern instanceof RegExp)) {
    //     pattern = new RegExp(pattern);
    //   }
    //   // todo
    // }
    /**
     * Create an instance based on a public key (certain methods will not be available)
     *
     * This method only accepts uncompressed Ethereum-style public keys, unless
     * the `nonStrict` flag is set to true.
     */
    static fromPublicKey(publicKey) {
        return new Wallet(undefined, publicKey);
    }
    /**
     * Create an instance based on a raw private key
     */
    static fromPrivateKey(privateKey) {
        return new Wallet(privateKey);
    }
    /**
     * Import a wallet (Version 3 of the Ethereum wallet format). Set `nonStrict` true to accept files with mixed-caps.
     *
     * @param input A JSON serialized string, or an object representing V3 Keystore.
     * @param password The keystore password.
     */
    static fromV3(input, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const json = typeof input === "object" ? input : JSON.parse(input);
            if (json.version !== 3) {
                throw new Error("Not a V3 wallet");
            }
            let derivedKey, kdfparams;
            if (json.crypto.kdf === "scrypt") {
                kdfparams = json.crypto.kdfparams;
                // FIXME: support progress reporting callback
                derivedKey = yield (0, scrypt_js_1.scrypt)(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
            }
            else if (json.crypto.kdf === "pbkdf2") {
                kdfparams = json.crypto.kdfparams;
                if (kdfparams.prf !== "hmac-sha256") {
                    throw new Error("Unsupported parameters to PBKDF2");
                }
                derivedKey = crypto.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.c, kdfparams.dklen, "sha256");
            }
            else {
                throw new Error("Unsupported key derivation scheme");
            }
            const ciphertext = Buffer.from(json.crypto.ciphertext, "hex");
            const mac = createHash("sha256")
                .update(Buffer.concat([Buffer.from(derivedKey.slice(16, 32)), ciphertext]))
                .digest("hex");
            if (mac.toString("hex") !== json.crypto.mac) {
                throw new Error("Key derivation failed - possibly wrong passphrase");
            }
            const decipher = crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, "hex"));
            const seed = runCipherBuffer(decipher, ciphertext);
            return new Wallet(seed);
        });
    }
    // private getters
    /**
     * Returns the wallet's public key.
     */
    get pubKey() {
        return this.publicKey;
    }
    /**
     * Returns the wallet's private key.
     */
    get privKey() {
        if (!this.privateKey) {
            throw new Error("This is a public key only wallet");
        }
        return this.privateKey;
    }
    // public instance methods
    /**
     * Returns the wallet's private key.
     *
     */
    // tslint:disable-next-line
    getPrivateKey() {
        return this.privKey;
    }
    getPrivateKeyString() {
        return this.privateKey.toString();
    }
    /**
     * Returns the wallet's public key.
     */
    // tslint:disable-next-line
    getPublicKey() {
        return this.pubKey;
    }
    /**
     * Returns the wallet's public key as a "0x" prefixed hex string
     */
    getPublicKeyString() {
        return this.pubKey.toString();
    }
    /**
     * Returns the wallet's address.
     */
    getAddress(type = AddressType.P2PKH, network = bitcoin.networks.bitcoin) {
        if (type === AddressType.P2PKH) {
            const { address } = bitcoin.payments.p2pkh({
                pubkey: this.publicKey,
                network: network,
            });
            return address;
        }
        else if (type === AddressType.SEGWIT) {
            const { address } = bitcoin.payments.p2wpkh({
                pubkey: this.publicKey,
                network: network,
            });
            return address;
        }
        else if (type === AddressType.TAPROOT) {
            const { address } = bitcoin.payments.p2tr({
                internalPubkey: this.publicKey.slice(1, 33),
                network: network,
            });
            return address;
        }
    }
    /**
     * Returns the wallet's address as a "0x" prefixed hex string
     */
    getAddressString(type = AddressType.P2PKH, network = bitcoin.networks.bitcoin) {
        return this.getAddress(type, network);
    }
    /**
     * Returns an Etherem Version 3 Keystore Format object representing the wallet
     *
     * @param password The password used to encrypt the Keystore.
     * @param opts The options for the keystore. See [its spec](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition) for more info.
     */
    toV3(password, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.privateKey) {
                throw new Error("This is a public key only wallet");
            }
            const v3Params = mergeToV3ParamsWithDefaults(opts);
            let kdfParams;
            let derivedKey;
            switch (v3Params.kdf) {
                case "pbkdf2" /* PBKDF */:
                    kdfParams = kdfParamsForPBKDF(v3Params);
                    derivedKey = crypto.pbkdf2Sync(Buffer.from(password), kdfParams.salt, kdfParams.c, kdfParams.dklen, "sha256");
                    break;
                case "scrypt" /* Scrypt */:
                    kdfParams = kdfParamsForScrypt(v3Params);
                    // FIXME: support progress reporting callback
                    derivedKey = yield (0, scrypt_js_1.scrypt)(Buffer.from(password), kdfParams.salt, kdfParams.n, kdfParams.r, kdfParams.p, kdfParams.dklen);
                    break;
                default:
                    throw new Error("Unsupported kdf");
            }
            const cipher = crypto.createCipheriv(v3Params.cipher, derivedKey.slice(0, 16), v3Params.iv);
            if (!cipher) {
                throw new Error("Unsupported cipher");
            }
            const ciphertext = runCipherBuffer(cipher, this.privKey);
            const mac = createHash("sha256")
                .update(Buffer.concat([Buffer.from(derivedKey.slice(16, 32)), ciphertext]))
                .digest("hex");
            return {
                version: 3,
                id: uuidv4({ random: v3Params.uuid }),
                // @ts-ignore - the official V3 keystore spec omits the address key
                address: this.getAddress().toString("hex"),
                crypto: {
                    ciphertext: ciphertext.toString("hex"),
                    cipherparams: { iv: v3Params.iv.toString("hex") },
                    cipher: v3Params.cipher,
                    kdf: v3Params.kdf,
                    kdfparams: Object.assign(Object.assign({}, kdfParams), { salt: kdfParams.salt.toString("hex") }),
                    mac: mac.toString("hex"),
                },
            };
        });
    }
    /**
     * Return the suggested filename for V3 keystores.
     */
    getV3Filename(timestamp) {
        /*
         * We want a timestamp like 2016-03-15T17-11-33.007598288Z. Date formatting
         * is a pain in Javascript, everbody knows that. We could use moment.js,
         * but decide to do it manually in order to save space.
         *
         * toJSON() returns a pretty close version, so let's use it. It is not UTC though,
         * but does it really matter?
         *
         * Alternative manual way with padding and Date fields: http://stackoverflow.com/a/7244288/4964819
         *
         */
        const ts = timestamp ? new Date(timestamp) : new Date();
        return [
            "UTC--",
            ts.toJSON().replace(/:/g, "-"),
            "--",
            this.getAddressString(),
        ].join("");
    }
    toV3String(password, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.stringify(yield this.toV3(password, opts));
        });
    }
}
exports.Wallet = Wallet;
function runCipherBuffer(cipher, data) {
    return Buffer.concat([cipher.update(data), cipher.final()]);
}
