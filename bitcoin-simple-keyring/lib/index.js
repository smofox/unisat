"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.SimpleKeyring = exports.toXOnly = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bitcore_lib_1 = __importDefault(require("bitcore-lib"));
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const events_1 = require("events");
const ecpair_1 = __importDefault(require("ecpair"));
const ecc = __importStar(require("tiny-secp256k1"));
bitcoin.initEccLib(ecc);
const ECPair = (0, ecpair_1.default)(ecc);
const bs58check_1 = require("bs58check");
const type = "Simple Key Pair";
const toXOnly = (pubKey) => pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
exports.toXOnly = toXOnly;
function tapTweakHash(pubKey, h) {
    return bitcoin.crypto.taggedHash("TapTweak", Buffer.concat(h ? [pubKey, h] : [pubKey]));
}
function tweakSigner(signer, opts = {}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey = signer.privateKey;
    if (!privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc.privateNegate(privateKey);
    }
    const tweakedPrivateKey = ecc.privateAdd(privateKey, tapTweakHash((0, exports.toXOnly)(signer.publicKey), opts.tweakHash));
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }
    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}
class SimpleKeyring extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.type = type;
        this.network = bitcoin.networks.bitcoin;
        this.wallets = [];
        if (opts) {
            this.deserialize(opts);
        }
    }
    serialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.wallets.map((wallet) => wallet.privateKey.toString("hex"));
        });
    }
    deserialize(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const privateKeys = opts;
            this.wallets = privateKeys.map((key) => {
                let buf;
                if (key.length === 64) {
                    // privateKey
                    buf = Buffer.from(key, "hex");
                }
                else {
                    // base58
                    buf = (0, bs58check_1.decode)(key).slice(1, 33);
                }
                return ECPair.fromPrivateKey(buf);
            });
        });
    }
    addAccounts(n = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const newWallets = [];
            for (let i = 0; i < n; i++) {
                newWallets.push(ECPair.makeRandom());
            }
            this.wallets = this.wallets.concat(newWallets);
            const hexWallets = newWallets.map(({ publicKey }) => publicKey.toString("hex"));
            return hexWallets;
        });
    }
    getAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.wallets.map(({ publicKey }) => publicKey.toString("hex"));
        });
    }
    signTransaction(psbt, inputs, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            inputs.forEach((input) => {
                const keyPair = this._getPrivateKeyFor(input.publicKey);
                if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[input.index]) &&
                    !input.disableTweakSigner) {
                    const signer = tweakSigner(keyPair, opts);
                    psbt.signInput(input.index, signer, input.sighashTypes);
                }
                else {
                    const signer = keyPair;
                    psbt.signInput(input.index, signer, input.sighashTypes);
                }
            });
            return psbt;
        });
    }
    signMessage(publicKey, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyPair = this._getPrivateKeyFor(publicKey);
            const message = new bitcore_lib_1.default.Message(text);
            return message.sign(new bitcore_lib_1.default.PrivateKey(keyPair.privateKey));
        });
    }
    verifyMessage(publicKey, text, sig) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = new bitcore_lib_1.default.Message(text);
            var signature = bitcore_lib_1.default.crypto.Signature.fromCompact(Buffer.from(sig, "base64"));
            var hash = message.magicHash();
            // recover the public key
            var ecdsa = new bitcore_lib_1.default.crypto.ECDSA();
            ecdsa.hashbuf = hash;
            ecdsa.sig = signature;
            const pubkeyInSig = ecdsa.toPublicKey();
            const pubkeyInSigString = new bitcore_lib_1.default.PublicKey(Object.assign({}, pubkeyInSig.toObject(), { compressed: true })).toString();
            if (pubkeyInSigString != publicKey) {
                return false;
            }
            return bitcore_lib_1.default.crypto.ECDSA.verify(hash, signature, pubkeyInSig);
        });
    }
    _getPrivateKeyFor(publicKey) {
        if (!publicKey) {
            throw new Error("Must specify publicKey.");
        }
        const wallet = this._getWalletForAccount(publicKey);
        return wallet;
    }
    exportAccount(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = this._getWalletForAccount(publicKey);
            return wallet.privateKey.toString("hex");
        });
    }
    removeAccount(publicKey) {
        if (!this.wallets
            .map((wallet) => wallet.publicKey.toString("hex"))
            .includes(publicKey)) {
            throw new Error(`PublicKey ${publicKey} not found in this keyring`);
        }
        this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString("hex") !== publicKey);
    }
    _getWalletForAccount(publicKey) {
        let wallet = this.wallets.find((wallet) => wallet.publicKey.toString("hex") == publicKey);
        if (!wallet) {
            throw new Error("Simple Keyring - Unable to find matching publicKey.");
        }
        return wallet;
    }
}
exports.SimpleKeyring = SimpleKeyring;
SimpleKeyring.type = type;
