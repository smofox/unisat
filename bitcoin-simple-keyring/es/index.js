import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _inheritsLoose from "@babel/runtime/helpers/esm/inheritsLoose";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import * as bitcoin from "bitcoinjs-lib";
import bitcore from "bitcore-lib";
import { isTaprootInput } from "bitcoinjs-lib/src/psbt/bip371";
import { EventEmitter } from "events";
import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";
bitcoin.initEccLib(ecc);
var ECPair = ECPairFactory(ecc);
import { decode } from "bs58check";
var type = "Simple Key Pair";
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
export var SimpleKeyring = /*#__PURE__*/function (_EventEmitter) {
  _inheritsLoose(SimpleKeyring, _EventEmitter);
  function SimpleKeyring(opts) {
    var _this;
    _this = _EventEmitter.call(this) || this;
    _this.type = type;
    _this.network = bitcoin.networks.bitcoin;
    _this.wallets = [];
    if (opts) {
      _this.deserialize(opts);
    }
    return _this;
  }
  var _proto = SimpleKeyring.prototype;
  _proto.serialize = /*#__PURE__*/function () {
    var _serialize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", this.wallets.map(function (wallet) {
              return wallet.privateKey.toString("hex");
            }));
          case 1:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    }));
    function serialize() {
      return _serialize.apply(this, arguments);
    }
    return serialize;
  }();
  _proto.deserialize = /*#__PURE__*/function () {
    var _deserialize = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(opts) {
      var privateKeys;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            privateKeys = opts;
            this.wallets = privateKeys.map(function (key) {
              var buf;
              if (key.length === 64) {
                // privateKey
                buf = Buffer.from(key, "hex");
              } else {
                // base58
                buf = decode(key).slice(1, 33);
              }
              return ECPair.fromPrivateKey(buf);
            });
          case 2:
          case "end":
            return _context2.stop();
        }
      }, _callee2, this);
    }));
    function deserialize(_x) {
      return _deserialize.apply(this, arguments);
    }
    return deserialize;
  }();
  _proto.addAccounts = /*#__PURE__*/function () {
    var _addAccounts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(n) {
      var newWallets, i, hexWallets;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            if (n === void 0) {
              n = 1;
            }
            newWallets = [];
            for (i = 0; i < n; i++) {
              newWallets.push(ECPair.makeRandom());
            }
            this.wallets = this.wallets.concat(newWallets);
            hexWallets = newWallets.map(function (_ref) {
              var publicKey = _ref.publicKey;
              return publicKey.toString("hex");
            });
            return _context3.abrupt("return", hexWallets);
          case 6:
          case "end":
            return _context3.stop();
        }
      }, _callee3, this);
    }));
    function addAccounts(_x2) {
      return _addAccounts.apply(this, arguments);
    }
    return addAccounts;
  }();
  _proto.getAccounts = /*#__PURE__*/function () {
    var _getAccounts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", this.wallets.map(function (_ref2) {
              var publicKey = _ref2.publicKey;
              return publicKey.toString("hex");
            }));
          case 1:
          case "end":
            return _context4.stop();
        }
      }, _callee4, this);
    }));
    function getAccounts() {
      return _getAccounts.apply(this, arguments);
    }
    return getAccounts;
  }();
  _proto.signTransaction = /*#__PURE__*/function () {
    var _signTransaction = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(psbt, inputs, opts) {
      var _this2 = this;
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            inputs.forEach(function (input) {
              var keyPair = _this2._getPrivateKeyFor(input.publicKey);
              if (isTaprootInput(psbt.data.inputs[input.index]) && !input.disableTweakSigner) {
                var signer = tweakSigner(keyPair, opts);
                psbt.signInput(input.index, signer, input.sighashTypes);
              } else {
                var _signer = keyPair;
                psbt.signInput(input.index, _signer, input.sighashTypes);
              }
            });
            return _context5.abrupt("return", psbt);
          case 2:
          case "end":
            return _context5.stop();
        }
      }, _callee5);
    }));
    function signTransaction(_x3, _x4, _x5) {
      return _signTransaction.apply(this, arguments);
    }
    return signTransaction;
  }();
  _proto.signMessage = /*#__PURE__*/function () {
    var _signMessage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(publicKey, text) {
      var keyPair, message;
      return _regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            keyPair = this._getPrivateKeyFor(publicKey);
            message = new bitcore.Message(text);
            return _context6.abrupt("return", message.sign(new bitcore.PrivateKey(keyPair.privateKey)));
          case 3:
          case "end":
            return _context6.stop();
        }
      }, _callee6, this);
    }));
    function signMessage(_x6, _x7) {
      return _signMessage.apply(this, arguments);
    }
    return signMessage;
  }();
  _proto.verifyMessage = /*#__PURE__*/function () {
    var _verifyMessage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(publicKey, text, sig) {
      var message, signature, hash, ecdsa, pubkeyInSig, pubkeyInSigString;
      return _regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) switch (_context7.prev = _context7.next) {
          case 0:
            message = new bitcore.Message(text);
            signature = bitcore.crypto.Signature.fromCompact(Buffer.from(sig, "base64"));
            hash = message.magicHash(); // recover the public key
            ecdsa = new bitcore.crypto.ECDSA();
            ecdsa.hashbuf = hash;
            ecdsa.sig = signature;
            pubkeyInSig = ecdsa.toPublicKey();
            pubkeyInSigString = new bitcore.PublicKey(Object.assign({}, pubkeyInSig.toObject(), {
              compressed: true
            })).toString();
            if (!(pubkeyInSigString != publicKey)) {
              _context7.next = 10;
              break;
            }
            return _context7.abrupt("return", false);
          case 10:
            return _context7.abrupt("return", bitcore.crypto.ECDSA.verify(hash, signature, pubkeyInSig));
          case 11:
          case "end":
            return _context7.stop();
        }
      }, _callee7);
    }));
    function verifyMessage(_x8, _x9, _x10) {
      return _verifyMessage.apply(this, arguments);
    }
    return verifyMessage;
  }();
  _proto._getPrivateKeyFor = function _getPrivateKeyFor(publicKey) {
    if (!publicKey) {
      throw new Error("Must specify publicKey.");
    }
    var wallet = this._getWalletForAccount(publicKey);
    return wallet;
  };
  _proto.exportAccount = /*#__PURE__*/function () {
    var _exportAccount = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee8(publicKey) {
      var wallet;
      return _regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            wallet = this._getWalletForAccount(publicKey);
            return _context8.abrupt("return", wallet.privateKey.toString("hex"));
          case 2:
          case "end":
            return _context8.stop();
        }
      }, _callee8, this);
    }));
    function exportAccount(_x11) {
      return _exportAccount.apply(this, arguments);
    }
    return exportAccount;
  }();
  _proto.removeAccount = function removeAccount(publicKey) {
    if (!this.wallets.map(function (wallet) {
      return wallet.publicKey.toString("hex");
    }).includes(publicKey)) {
      throw new Error("PublicKey " + publicKey + " not found in this keyring");
    }
    this.wallets = this.wallets.filter(function (wallet) {
      return wallet.publicKey.toString("hex") !== publicKey;
    });
  };
  _proto._getWalletForAccount = function _getWalletForAccount(publicKey) {
    var wallet = this.wallets.find(function (wallet) {
      return wallet.publicKey.toString("hex") == publicKey;
    });
    if (!wallet) {
      throw new Error("Simple Keyring - Unable to find matching publicKey.");
    }
    return wallet;
  };
  return SimpleKeyring;
}(EventEmitter);
SimpleKeyring.type = type;