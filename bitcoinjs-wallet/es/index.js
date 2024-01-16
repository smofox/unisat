import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _extends from "@babel/runtime/helpers/esm/extends";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import * as bitcoin from "bitcoinjs-lib";
import * as crypto from "crypto";
import randomBytes from "randombytes";
import { scrypt } from "scrypt-js";
import { v4 } from "uuid";
import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";

var createHash = require("create-hash");

bitcoin.initEccLib(ecc);
var ECPair = ECPairFactory(ecc);
var uuidv4 = v4; // KDF

var KDFFunctions;

(function (KDFFunctions) {
  KDFFunctions["PBKDF"] = "pbkdf2";
  KDFFunctions["Scrypt"] = "scrypt";
})(KDFFunctions || (KDFFunctions = {}));

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
    throw new Error("Invalid length argument, must be an even number");
  }

  if (typeof length === "number" && str.length !== length) {
    throw new Error("Invalid " + paramName + ", string must be " + length + " hex characters");
  }

  if (!/^([0-9a-f]{2})+$/i.test(str)) {
    var howMany = typeof length === "number" ? length : "empty or a non-zero even number of";
    throw new Error("Invalid " + paramName + ", string must be " + howMany + " hex characters");
  }

  return str;
}

function validateBuffer(paramName, buff, length) {
  if (!Buffer.isBuffer(buff)) {
    var howManyHex = typeof length === "number" ? "" + length * 2 : "empty or a non-zero even number of";
    var howManyBytes = typeof length === "number" ? " (" + length + " bytes)" : "";
    throw new Error("Invalid " + paramName + ", must be a string (" + howManyHex + " hex characters) or buffer" + howManyBytes);
  }

  if (typeof length === "number" && buff.length !== length) {
    throw new Error("Invalid " + paramName + ", buffer must be " + length + " bytes");
  }

  return buff;
}

function mergeToV3ParamsWithDefaults(params) {
  var v3Defaults = {
    cipher: "aes-128-ctr",
    kdf: "scrypt",
    salt: randomBytes(32),
    iv: randomBytes(16),
    uuid: randomBytes(16),
    dklen: 32,
    c: 262144,
    n: 262144,
    r: 8,
    p: 1
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

  return _extends({}, v3Defaults, params);
}

function kdfParamsForPBKDF(opts) {
  return {
    dklen: opts.dklen,
    salt: opts.salt,
    c: opts.c,
    prf: "hmac-sha256"
  };
}

function kdfParamsForScrypt(opts) {
  return {
    dklen: opts.dklen,
    salt: opts.salt,
    n: opts.n,
    r: opts.r,
    p: opts.p
  };
}

export var Wallet = /*#__PURE__*/function () {
  function Wallet(privateKey, publicKey, network) {
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
  } // static methods

  /**
   * Create an instance based on a new random key.
   *
   */


  Wallet.generate = function generate(network) {
    var keyPair = ECPair.makeRandom({
      network: network
    });
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
  ;

  Wallet.fromPublicKey = function fromPublicKey(publicKey) {
    return new Wallet(undefined, publicKey);
  }
  /**
   * Create an instance based on a raw private key
   */
  ;

  Wallet.fromPrivateKey = function fromPrivateKey(privateKey) {
    return new Wallet(privateKey);
  }
  /**
   * Import a wallet (Version 3 of the Ethereum wallet format). Set `nonStrict` true to accept files with mixed-caps.
   *
   * @param input A JSON serialized string, or an object representing V3 Keystore.
   * @param password The keystore password.
   */
  ;

  Wallet.fromV3 =
  /*#__PURE__*/
  function () {
    var _fromV = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(input, password) {
      var json, derivedKey, kdfparams, ciphertext, mac, decipher, seed;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              json = typeof input === "object" ? input : JSON.parse(input);

              if (!(json.version !== 3)) {
                _context.next = 3;
                break;
              }

              throw new Error("Not a V3 wallet");

            case 3:
              if (!(json.crypto.kdf === "scrypt")) {
                _context.next = 10;
                break;
              }

              kdfparams = json.crypto.kdfparams; // FIXME: support progress reporting callback

              _context.next = 7;
              return scrypt(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);

            case 7:
              derivedKey = _context.sent;
              _context.next = 18;
              break;

            case 10:
              if (!(json.crypto.kdf === "pbkdf2")) {
                _context.next = 17;
                break;
              }

              kdfparams = json.crypto.kdfparams;

              if (!(kdfparams.prf !== "hmac-sha256")) {
                _context.next = 14;
                break;
              }

              throw new Error("Unsupported parameters to PBKDF2");

            case 14:
              derivedKey = crypto.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.c, kdfparams.dklen, "sha256");
              _context.next = 18;
              break;

            case 17:
              throw new Error("Unsupported key derivation scheme");

            case 18:
              ciphertext = Buffer.from(json.crypto.ciphertext, "hex");
              mac = createHash("sha256").update(Buffer.concat([Buffer.from(derivedKey.slice(16, 32)), ciphertext])).digest("hex");

              if (!(mac.toString("hex") !== json.crypto.mac)) {
                _context.next = 22;
                break;
              }

              throw new Error("Key derivation failed - possibly wrong passphrase");

            case 22:
              decipher = crypto.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, "hex"));
              seed = runCipherBuffer(decipher, ciphertext);
              return _context.abrupt("return", new Wallet(seed));

            case 25:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function fromV3(_x, _x2) {
      return _fromV.apply(this, arguments);
    }

    return fromV3;
  }() // private getters

  /**
   * Returns the wallet's public key.
   */
  ;

  var _proto = Wallet.prototype;

  // public instance methods

  /**
   * Returns the wallet's private key.
   *
   */
  // tslint:disable-next-line
  _proto.getPrivateKey = function getPrivateKey() {
    return this.privKey;
  };

  _proto.getPrivateKeyString = function getPrivateKeyString() {
    return this.privateKey.toString();
  }
  /**
   * Returns the wallet's public key.
   */
  // tslint:disable-next-line
  ;

  _proto.getPublicKey = function getPublicKey() {
    return this.pubKey;
  }
  /**
   * Returns the wallet's public key as a "0x" prefixed hex string
   */
  ;

  _proto.getPublicKeyString = function getPublicKeyString() {
    return this.pubKey.toString();
  }
  /**
   * Returns the wallet's address.
   */
  ;

  _proto.getAddress = function getAddress(type, network) {
    if (type === void 0) {
      type = AddressType.P2PKH;
    }

    if (network === void 0) {
      network = bitcoin.networks.bitcoin;
    }

    if (type === AddressType.P2PKH) {
      var _bitcoin$payments$p2p = bitcoin.payments.p2pkh({
        pubkey: this.publicKey,
        network: network
      }),
          address = _bitcoin$payments$p2p.address;

      return address;
    } else if (type === AddressType.SEGWIT) {
      var _bitcoin$payments$p2w = bitcoin.payments.p2wpkh({
        pubkey: this.publicKey,
        network: network
      }),
          _address = _bitcoin$payments$p2w.address;

      return _address;
    } else if (type === AddressType.TAPROOT) {
      var _bitcoin$payments$p2t = bitcoin.payments.p2tr({
        internalPubkey: this.publicKey.slice(1, 33),
        network: network
      }),
          _address2 = _bitcoin$payments$p2t.address;

      return _address2;
    }
  }
  /**
   * Returns the wallet's address as a "0x" prefixed hex string
   */
  ;

  _proto.getAddressString = function getAddressString(type, network) {
    if (type === void 0) {
      type = AddressType.P2PKH;
    }

    if (network === void 0) {
      network = bitcoin.networks.bitcoin;
    }

    return this.getAddress(type, network);
  }
  /**
   * Returns an Etherem Version 3 Keystore Format object representing the wallet
   *
   * @param password The password used to encrypt the Keystore.
   * @param opts The options for the keystore. See [its spec](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition) for more info.
   */
  ;

  _proto.toV3 =
  /*#__PURE__*/
  function () {
    var _toV = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(password, opts) {
      var v3Params, kdfParams, derivedKey, cipher, ciphertext, mac;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (this.privateKey) {
                _context2.next = 2;
                break;
              }

              throw new Error("This is a public key only wallet");

            case 2:
              v3Params = mergeToV3ParamsWithDefaults(opts);
              _context2.t0 = v3Params.kdf;
              _context2.next = _context2.t0 === KDFFunctions.PBKDF ? 6 : _context2.t0 === KDFFunctions.Scrypt ? 9 : 14;
              break;

            case 6:
              kdfParams = kdfParamsForPBKDF(v3Params);
              derivedKey = crypto.pbkdf2Sync(Buffer.from(password), kdfParams.salt, kdfParams.c, kdfParams.dklen, "sha256");
              return _context2.abrupt("break", 15);

            case 9:
              kdfParams = kdfParamsForScrypt(v3Params); // FIXME: support progress reporting callback

              _context2.next = 12;
              return scrypt(Buffer.from(password), kdfParams.salt, kdfParams.n, kdfParams.r, kdfParams.p, kdfParams.dklen);

            case 12:
              derivedKey = _context2.sent;
              return _context2.abrupt("break", 15);

            case 14:
              throw new Error("Unsupported kdf");

            case 15:
              cipher = crypto.createCipheriv(v3Params.cipher, derivedKey.slice(0, 16), v3Params.iv);

              if (cipher) {
                _context2.next = 18;
                break;
              }

              throw new Error("Unsupported cipher");

            case 18:
              ciphertext = runCipherBuffer(cipher, this.privKey);
              mac = createHash("sha256").update(Buffer.concat([Buffer.from(derivedKey.slice(16, 32)), ciphertext])).digest("hex");
              return _context2.abrupt("return", {
                version: 3,
                id: uuidv4({
                  random: v3Params.uuid
                }),
                // @ts-ignore - the official V3 keystore spec omits the address key
                address: this.getAddress().toString("hex"),
                crypto: {
                  ciphertext: ciphertext.toString("hex"),
                  cipherparams: {
                    iv: v3Params.iv.toString("hex")
                  },
                  cipher: v3Params.cipher,
                  kdf: v3Params.kdf,
                  kdfparams: _extends({}, kdfParams, {
                    salt: kdfParams.salt.toString("hex")
                  }),
                  mac: mac.toString("hex")
                }
              });

            case 21:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function toV3(_x3, _x4) {
      return _toV.apply(this, arguments);
    }

    return toV3;
  }()
  /**
   * Return the suggested filename for V3 keystores.
   */
  ;

  _proto.getV3Filename = function getV3Filename(timestamp) {
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
    var ts = timestamp ? new Date(timestamp) : new Date();
    return ["UTC--", ts.toJSON().replace(/:/g, "-"), "--", this.getAddressString()].join("");
  };

  _proto.toV3String = /*#__PURE__*/function () {
    var _toV3String = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(password, opts) {
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.t0 = JSON;
              _context3.next = 3;
              return this.toV3(password, opts);

            case 3:
              _context3.t1 = _context3.sent;
              return _context3.abrupt("return", _context3.t0.stringify.call(_context3.t0, _context3.t1));

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function toV3String(_x5, _x6) {
      return _toV3String.apply(this, arguments);
    }

    return toV3String;
  }();

  _createClass(Wallet, [{
    key: "pubKey",
    get: function get() {
      return this.publicKey;
    }
    /**
     * Returns the wallet's private key.
     */

  }, {
    key: "privKey",
    get: function get() {
      if (!this.privateKey) {
        throw new Error("This is a public key only wallet");
      }

      return this.privateKey;
    }
  }]);

  return Wallet;
}();

function runCipherBuffer(cipher, data) {
  return Buffer.concat([cipher.update(data), cipher["final"]()]);
}