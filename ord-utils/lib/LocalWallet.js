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
exports.LocalWallet = exports.randomWIF = exports.publicKeyToScriptPk = exports.publicKeyToAddress = exports.publicKeyToPayment = exports.toPsbtNetwork = exports.NetworkType = exports.toXOnly = void 0;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const secp256k1_1 = __importDefault(require("@bitcoinerlab/secp256k1"));
bitcoin.initEccLib(secp256k1_1.default);
const ecpair_1 = __importDefault(require("ecpair"));
const OrdTransaction_1 = require("./OrdTransaction");
const OrdTransaction_2 = require("./OrdTransaction");
const ECPair = (0, ecpair_1.default)(secp256k1_1.default);
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
        privateKey = secp256k1_1.default.privateNegate(privateKey);
    }
    const tweakedPrivateKey = secp256k1_1.default.privateAdd(privateKey, tapTweakHash((0, exports.toXOnly)(signer.publicKey), opts.tweakHash));
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }
    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}
var NetworkType;
(function (NetworkType) {
    NetworkType[NetworkType["MAINNET"] = 0] = "MAINNET";
    NetworkType[NetworkType["TESTNET"] = 1] = "TESTNET";
})(NetworkType = exports.NetworkType || (exports.NetworkType = {}));
function toPsbtNetwork(networkType) {
    if (networkType === NetworkType.MAINNET) {
        return bitcoin.networks.bitcoin;
    }
    else {
        return bitcoin.networks.testnet;
    }
}
exports.toPsbtNetwork = toPsbtNetwork;
function publicKeyToPayment(publicKey, type, networkType) {
    const network = toPsbtNetwork(networkType);
    if (!publicKey)
        return null;
    const pubkey = Buffer.from(publicKey, "hex");
    if (type === OrdTransaction_1.AddressType.P2PKH) {
        return bitcoin.payments.p2pkh({
            pubkey,
            network,
        });
    }
    else if (type === OrdTransaction_1.AddressType.P2WPKH || type === OrdTransaction_1.AddressType.M44_P2WPKH) {
        return bitcoin.payments.p2wpkh({
            pubkey,
            network,
        });
    }
    else if (type === OrdTransaction_1.AddressType.P2TR || type === OrdTransaction_1.AddressType.M44_P2TR) {
        return bitcoin.payments.p2tr({
            internalPubkey: pubkey.slice(1, 33),
            network,
        });
    }
    else if (type === OrdTransaction_1.AddressType.P2SH_P2WPKH) {
        const data = bitcoin.payments.p2wpkh({
            pubkey,
            network,
        });
        return bitcoin.payments.p2sh({
            pubkey,
            network,
            redeem: data,
        });
    }
}
exports.publicKeyToPayment = publicKeyToPayment;
function publicKeyToAddress(publicKey, type, networkType) {
    const payment = publicKeyToPayment(publicKey, type, networkType);
    if (payment && payment.address) {
        return payment.address;
    }
    else {
        return "";
    }
}
exports.publicKeyToAddress = publicKeyToAddress;
function publicKeyToScriptPk(publicKey, type, networkType) {
    const payment = publicKeyToPayment(publicKey, type, networkType);
    return payment.output.toString("hex");
}
exports.publicKeyToScriptPk = publicKeyToScriptPk;
function randomWIF(networkType = NetworkType.TESTNET) {
    const network = toPsbtNetwork(networkType);
    const keyPair = ECPair.makeRandom({ network });
    return keyPair.toWIF();
}
exports.randomWIF = randomWIF;
class LocalWallet {
    constructor(wif, networkType = NetworkType.TESTNET, addressType = OrdTransaction_1.AddressType.P2WPKH) {
        const network = toPsbtNetwork(networkType);
        const keyPair = ECPair.fromWIF(wif, network);
        this.keyPair = keyPair;
        this.pubkey = keyPair.publicKey.toString("hex");
        this.address = publicKeyToAddress(this.pubkey, addressType, networkType);
        this.network = network;
    }
    signPsbt(psbt, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const _opts = opts || {
                autoFinalized: true,
            };
            const psbtNetwork = this.network;
            const toSignInputs = [];
            psbt.data.inputs.forEach((v, index) => {
                let script = null;
                let value = 0;
                if (v.witnessUtxo) {
                    script = v.witnessUtxo.script;
                    value = v.witnessUtxo.value;
                }
                else if (v.nonWitnessUtxo) {
                    const tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
                    const output = tx.outs[psbt.txInputs[index].index];
                    script = output.script;
                    value = output.value;
                }
                const isSigned = v.finalScriptSig || v.finalScriptWitness;
                if (script && !isSigned) {
                    const address = bitcoin.address.fromOutputScript(script, psbtNetwork);
                    if (this.address === address) {
                        toSignInputs.push({
                            index,
                            publicKey: this.pubkey,
                            sighashTypes: v.sighashType ? [v.sighashType] : undefined,
                        });
                    }
                }
            });
            const _inputs = _opts.inputs || toSignInputs;
            if (_inputs.length == 0) {
                throw new Error("no input to sign");
            }
            _inputs.forEach((input) => {
                const keyPair = this.keyPair;
                if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[input.index])) {
                    const signer = tweakSigner(keyPair, opts);
                    psbt.signInput(input.index, signer, input.sighashTypes);
                }
                else {
                    const signer = keyPair;
                    psbt.signInput(input.index, signer, input.sighashTypes);
                }
                if (_opts.autoFinalized !== false) {
                    psbt.validateSignaturesOfInput(input.index, OrdTransaction_2.validator);
                    psbt.finalizeInput(input.index);
                }
            });
            return psbt;
        });
    }
    getPublicKey() {
        return this.keyPair.publicKey.toString("hex");
    }
}
exports.LocalWallet = LocalWallet;
