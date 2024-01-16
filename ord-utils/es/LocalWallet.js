import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import * as bitcoin from "bitcoinjs-lib";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";
import ecc from "@bitcoinerlab/secp256k1";
bitcoin.initEccLib(ecc);
import ECPairFactory from "ecpair";
import { AddressType } from "./OrdTransaction";
import { validator } from "./OrdTransaction";
var ECPair = ECPairFactory(ecc);
export var toXOnly = function toXOnly(pubKey) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
};

function tapTweakHash(pubKey, h) {
  return bitcoin.crypto.taggedHash("TapTweak", Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

function tweakSigner(signer, opts) {
  if (opts === void 0) {
    opts = {};
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  var privateKey = signer.privateKey;

  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }

  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  var tweakedPrivateKey = ecc.privateAdd(privateKey, tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash));

  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network
  });
}

export var NetworkType;

(function (NetworkType) {
  NetworkType[NetworkType["MAINNET"] = 0] = "MAINNET";
  NetworkType[NetworkType["TESTNET"] = 1] = "TESTNET";
})(NetworkType || (NetworkType = {}));

export function toPsbtNetwork(networkType) {
  if (networkType === NetworkType.MAINNET) {
    return bitcoin.networks.bitcoin;
  } else {
    return bitcoin.networks.testnet;
  }
}
export function publicKeyToPayment(publicKey, type, networkType) {
  var network = toPsbtNetwork(networkType);
  if (!publicKey) return null;
  var pubkey = Buffer.from(publicKey, "hex");

  if (type === AddressType.P2PKH) {
    return bitcoin.payments.p2pkh({
      pubkey: pubkey,
      network: network
    });
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    return bitcoin.payments.p2wpkh({
      pubkey: pubkey,
      network: network
    });
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    return bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1, 33),
      network: network
    });
  } else if (type === AddressType.P2SH_P2WPKH) {
    var data = bitcoin.payments.p2wpkh({
      pubkey: pubkey,
      network: network
    });
    return bitcoin.payments.p2sh({
      pubkey: pubkey,
      network: network,
      redeem: data
    });
  }
}
export function publicKeyToAddress(publicKey, type, networkType) {
  var payment = publicKeyToPayment(publicKey, type, networkType);

  if (payment && payment.address) {
    return payment.address;
  } else {
    return "";
  }
}
export function publicKeyToScriptPk(publicKey, type, networkType) {
  var payment = publicKeyToPayment(publicKey, type, networkType);
  return payment.output.toString("hex");
}
export function randomWIF(networkType) {
  if (networkType === void 0) {
    networkType = NetworkType.TESTNET;
  }

  var network = toPsbtNetwork(networkType);
  var keyPair = ECPair.makeRandom({
    network: network
  });
  return keyPair.toWIF();
}
export var LocalWallet = /*#__PURE__*/function () {
  function LocalWallet(wif, networkType, addressType) {
    if (networkType === void 0) {
      networkType = NetworkType.TESTNET;
    }

    if (addressType === void 0) {
      addressType = AddressType.P2WPKH;
    }

    var network = toPsbtNetwork(networkType);
    var keyPair = ECPair.fromWIF(wif, network);
    this.keyPair = keyPair;
    this.pubkey = keyPair.publicKey.toString("hex");
    this.address = publicKeyToAddress(this.pubkey, addressType, networkType);
    this.network = network;
  }

  var _proto = LocalWallet.prototype;

  _proto.signPsbt = /*#__PURE__*/function () {
    var _signPsbt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(psbt, opts) {
      var _this = this;

      var _opts, psbtNetwork, toSignInputs, _inputs;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _opts = opts || {
                autoFinalized: true
              };
              psbtNetwork = this.network;
              toSignInputs = [];
              psbt.data.inputs.forEach(function (v, index) {
                var script = null;
                var value = 0;

                if (v.witnessUtxo) {
                  script = v.witnessUtxo.script;
                  value = v.witnessUtxo.value;
                } else if (v.nonWitnessUtxo) {
                  var tx = bitcoin.Transaction.fromBuffer(v.nonWitnessUtxo);
                  var output = tx.outs[psbt.txInputs[index].index];
                  script = output.script;
                  value = output.value;
                }

                var isSigned = v.finalScriptSig || v.finalScriptWitness;

                if (script && !isSigned) {
                  var address = bitcoin.address.fromOutputScript(script, psbtNetwork);

                  if (_this.address === address) {
                    toSignInputs.push({
                      index: index,
                      publicKey: _this.pubkey,
                      sighashTypes: v.sighashType ? [v.sighashType] : undefined
                    });
                  }
                }
              });
              _inputs = _opts.inputs || toSignInputs;

              if (!(_inputs.length == 0)) {
                _context.next = 7;
                break;
              }

              throw new Error("no input to sign");

            case 7:
              _inputs.forEach(function (input) {
                var keyPair = _this.keyPair;

                if (isTaprootInput(psbt.data.inputs[input.index])) {
                  var signer = tweakSigner(keyPair, opts);
                  psbt.signInput(input.index, signer, input.sighashTypes);
                } else {
                  var _signer = keyPair;
                  psbt.signInput(input.index, _signer, input.sighashTypes);
                }

                if (_opts.autoFinalized !== false) {
                  psbt.validateSignaturesOfInput(input.index, validator);
                  psbt.finalizeInput(input.index);
                }
              });

              return _context.abrupt("return", psbt);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function signPsbt(_x, _x2) {
      return _signPsbt.apply(this, arguments);
    }

    return signPsbt;
  }();

  _proto.getPublicKey = function getPublicKey() {
    return this.keyPair.publicKey.toString("hex");
  };

  return LocalWallet;
}();