import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { UTXO_DUST } from "./OrdUnspendOutput";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
bitcoin.initEccLib(ecc);
var ECPair = ECPairFactory(ecc);
export var validator = function validator(pubkey, msghash, signature) {
  return ECPair.fromPublicKey(pubkey).verify(msghash, signature);
};
export var AddressType;

(function (AddressType) {
  AddressType[AddressType["P2PKH"] = 0] = "P2PKH";
  AddressType[AddressType["P2WPKH"] = 1] = "P2WPKH";
  AddressType[AddressType["P2TR"] = 2] = "P2TR";
  AddressType[AddressType["P2SH_P2WPKH"] = 3] = "P2SH_P2WPKH";
  AddressType[AddressType["M44_P2WPKH"] = 4] = "M44_P2WPKH";
  AddressType[AddressType["M44_P2TR"] = 5] = "M44_P2TR";
})(AddressType || (AddressType = {}));

export var toXOnly = function toXOnly(pubKey) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
};
export function utxoToInput(utxo, publicKey) {
  if (utxo.addressType === AddressType.P2TR || utxo.addressType === AddressType.M44_P2TR) {
    var data = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex")
      },
      tapInternalKey: toXOnly(publicKey)
    };
    return {
      data: data,
      utxo: utxo
    };
  } else if (utxo.addressType === AddressType.P2WPKH || utxo.addressType === AddressType.M44_P2WPKH) {
    var _data = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex")
      }
    };
    return {
      data: _data,
      utxo: utxo
    };
  } else if (utxo.addressType === AddressType.P2PKH) {
    var _data2 = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex")
      }
    };
    return {
      data: _data2,
      utxo: utxo
    };
  } else if (utxo.addressType === AddressType.P2SH_P2WPKH) {
    var redeemData = bitcoin.payments.p2wpkh({
      pubkey: publicKey
    });
    var _data3 = {
      hash: utxo.txId,
      index: utxo.outputIndex,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex")
      },
      redeemScript: redeemData.output
    };
    return {
      data: _data3,
      utxo: utxo
    };
  }
}
export var OrdTransaction = /*#__PURE__*/function () {
  function OrdTransaction(wallet, network, pubkey, feeRate) {
    this.inputs = [];
    this.outputs = [];
    this.changeOutputIndex = -1;
    this.network = bitcoin.networks.bitcoin;
    this.enableRBF = true;
    this.wallet = wallet;
    this.network = network;
    this.pubkey = pubkey;
    this.feeRate = feeRate || 5;
  }

  var _proto = OrdTransaction.prototype;

  _proto.setEnableRBF = function setEnableRBF(enable) {
    this.enableRBF = enable;
  };

  _proto.setChangeAddress = function setChangeAddress(address) {
    this.changedAddress = address;
  };

  _proto.addInput = function addInput(utxo) {
    this.inputs.push(utxoToInput(utxo, Buffer.from(this.pubkey, "hex")));
  };

  _proto.getTotalInput = function getTotalInput() {
    return this.inputs.reduce(function (pre, cur) {
      return pre + cur.data.witnessUtxo.value;
    }, 0);
  };

  _proto.getTotalOutput = function getTotalOutput() {
    return this.outputs.reduce(function (pre, cur) {
      return pre + cur.value;
    }, 0);
  };

  _proto.getUnspent = function getUnspent() {
    return this.getTotalInput() - this.getTotalOutput();
  };

  _proto.isEnoughFee = /*#__PURE__*/function () {
    var _isEnoughFee = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var psbt1;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return this.createSignedPsbt();

            case 2:
              psbt1 = _context.sent;

              if (!(psbt1.getFeeRate() >= this.feeRate)) {
                _context.next = 7;
                break;
              }

              return _context.abrupt("return", true);

            case 7:
              return _context.abrupt("return", false);

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function isEnoughFee() {
      return _isEnoughFee.apply(this, arguments);
    }

    return isEnoughFee;
  }();

  _proto.calNetworkFee = /*#__PURE__*/function () {
    var _calNetworkFee = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var psbt, txSize, fee;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this.createSignedPsbt();

            case 2:
              psbt = _context2.sent;
              txSize = psbt.extractTransaction(true).toBuffer().length;
              psbt.data.inputs.forEach(function (v) {
                if (v.finalScriptWitness) {
                  txSize -= v.finalScriptWitness.length * 0.75;
                }
              });
              fee = Math.ceil(txSize * this.feeRate);
              return _context2.abrupt("return", fee);

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function calNetworkFee() {
      return _calNetworkFee.apply(this, arguments);
    }

    return calNetworkFee;
  }();

  _proto.addOutput = function addOutput(address, value) {
    this.outputs.push({
      address: address,
      value: value
    });
  };

  _proto.getOutput = function getOutput(index) {
    return this.outputs[index];
  };

  _proto.addChangeOutput = function addChangeOutput(value) {
    this.outputs.push({
      address: this.changedAddress,
      value: value
    });
    this.changeOutputIndex = this.outputs.length - 1;
  };

  _proto.getChangeOutput = function getChangeOutput() {
    return this.outputs[this.changeOutputIndex];
  };

  _proto.getChangeAmount = function getChangeAmount() {
    var output = this.getChangeOutput();
    return output ? output.value : 0;
  };

  _proto.removeChangeOutput = function removeChangeOutput() {
    this.outputs.splice(this.changeOutputIndex, 1);
    this.changeOutputIndex = -1;
  };

  _proto.removeRecentOutputs = function removeRecentOutputs(count) {
    this.outputs.splice(-count);
  };

  _proto.createSignedPsbt = /*#__PURE__*/function () {
    var _createSignedPsbt = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
      var _this = this;

      var psbt;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              psbt = new bitcoin.Psbt({
                network: this.network
              });
              this.inputs.forEach(function (v, index) {
                if (v.utxo.addressType === AddressType.P2PKH) {
                  //@ts-ignore
                  psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
                }

                psbt.addInput(v.data);

                if (_this.enableRBF) {
                  psbt.setInputSequence(index, 0xfffffffd); // support RBF
                }
              });
              this.outputs.forEach(function (v) {
                psbt.addOutput(v);
              });
              _context3.next = 5;
              return this.wallet.signPsbt(psbt);

            case 5:
              return _context3.abrupt("return", psbt);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function createSignedPsbt() {
      return _createSignedPsbt.apply(this, arguments);
    }

    return createSignedPsbt;
  }();

  _proto.generate = /*#__PURE__*/function () {
    var _generate = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(autoAdjust) {
      var unspent, psbt1, txSize, fee, left, psbt2, tx, rawtx, toAmount;
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              // Try to estimate fee
              unspent = this.getUnspent();
              this.addChangeOutput(Math.max(unspent, 0));
              _context4.next = 4;
              return this.createSignedPsbt();

            case 4:
              psbt1 = _context4.sent;
              // this.dumpTx(psbt1);
              this.removeChangeOutput(); // todo: support changing the feeRate

              txSize = psbt1.extractTransaction().toBuffer().length;
              fee = txSize * this.feeRate;

              if (unspent > fee) {
                left = unspent - fee;

                if (left > UTXO_DUST) {
                  this.addChangeOutput(left);
                }
              } else {
                if (autoAdjust) {
                  this.outputs[0].value -= fee - unspent;
                }
              }

              _context4.next = 11;
              return this.createSignedPsbt();

            case 11:
              psbt2 = _context4.sent;
              tx = psbt2.extractTransaction();
              rawtx = tx.toHex();
              toAmount = this.outputs[0].value;
              return _context4.abrupt("return", {
                fee: psbt2.getFee(),
                rawtx: rawtx,
                toSatoshis: toAmount,
                estimateFee: fee
              });

            case 16:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function generate(_x) {
      return _generate.apply(this, arguments);
    }

    return generate;
  }();

  _proto.dumpTx = /*#__PURE__*/function () {
    var _dumpTx = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(psbt) {
      var tx, size, feePaid, feeRate;
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              tx = psbt.extractTransaction();
              size = tx.toBuffer().length;
              feePaid = psbt.getFee();
              feeRate = psbt.getFeeRate();
              console.log("\n=============================================================================================\nSummary\n  txid:     " + tx.getId() + "\n  Size:     " + tx.byteLength() + "\n  Fee Paid: " + psbt.getFee() + "\n  Fee Rate: " + feeRate + " sat/vB\n  Detail:   " + psbt.txInputs.length + " Inputs, " + psbt.txOutputs.length + " Outputs\n----------------------------------------------------------------------------------------------\nInputs\n" + this.inputs.map(function (input, index) {
                var str = "\n=>" + index + " " + input.data.witnessUtxo.value + " Sats\n        lock-size: " + input.data.witnessUtxo.script.length + "\n        via " + input.data.hash + " [" + input.data.index + "]\n";
                return str;
              }).join("") + "\ntotal: " + this.getTotalInput() + " Sats\n----------------------------------------------------------------------------------------------\nOutputs\n" + this.outputs.map(function (output, index) {
                var str = "\n=>" + index + " " + output.address + " " + output.value + " Sats";
                return str;
              }).join("") + "\n\ntotal: " + this.getTotalOutput() + " Sats\n=============================================================================================\n    ");

            case 5:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function dumpTx(_x2) {
      return _dumpTx.apply(this, arguments);
    }

    return dumpTx;
  }();

  return OrdTransaction;
}();