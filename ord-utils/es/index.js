import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { OrdTransaction } from "./OrdTransaction";
import { OrdUnspendOutput, UTXO_DUST } from "./OrdUnspendOutput";
import { satoshisToAmount } from "./utils";
export function createSendBTC(_x) {
  return _createSendBTC.apply(this, arguments);
}

function _createSendBTC() {
  _createSendBTC = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(_ref) {
    var utxos, toAddress, toAmount, wallet, network, changeAddress, receiverToPayFee, feeRate, pubkey, dump, _ref$enableRBF, enableRBF, tx, nonOrdUtxos, ordUtxos, outputAmount, tmpSum, i, nonOrdUtxo, fee, unspent, networkFee, output, _unspent, _networkFee, leftAmount, psbt;

    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            utxos = _ref.utxos, toAddress = _ref.toAddress, toAmount = _ref.toAmount, wallet = _ref.wallet, network = _ref.network, changeAddress = _ref.changeAddress, receiverToPayFee = _ref.receiverToPayFee, feeRate = _ref.feeRate, pubkey = _ref.pubkey, dump = _ref.dump, _ref$enableRBF = _ref.enableRBF, enableRBF = _ref$enableRBF === void 0 ? true : _ref$enableRBF;
            tx = new OrdTransaction(wallet, network, pubkey, feeRate);
            tx.setEnableRBF(enableRBF);
            tx.setChangeAddress(changeAddress);
            nonOrdUtxos = [];
            ordUtxos = [];
            utxos.forEach(function (v) {
              if (v.ords.length > 0) {
                ordUtxos.push(v);
              } else {
                nonOrdUtxos.push(v);
              }
            });
            tx.addOutput(toAddress, toAmount);
            outputAmount = tx.getTotalOutput();
            tmpSum = tx.getTotalInput();
            i = 0;

          case 11:
            if (!(i < nonOrdUtxos.length)) {
              _context.next = 29;
              break;
            }

            nonOrdUtxo = nonOrdUtxos[i];

            if (!(tmpSum < outputAmount)) {
              _context.next = 17;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            return _context.abrupt("continue", 26);

          case 17:
            _context.next = 19;
            return tx.calNetworkFee();

          case 19:
            fee = _context.sent;

            if (!(tmpSum < outputAmount + fee)) {
              _context.next = 25;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            _context.next = 26;
            break;

          case 25:
            return _context.abrupt("break", 29);

          case 26:
            i++;
            _context.next = 11;
            break;

          case 29:
            if (!(nonOrdUtxos.length === 0)) {
              _context.next = 31;
              break;
            }

            throw new Error("Balance not enough");

          case 31:
            if (!receiverToPayFee) {
              _context.next = 43;
              break;
            }

            unspent = tx.getUnspent();

            if (unspent >= UTXO_DUST) {
              tx.addChangeOutput(unspent);
            }

            _context.next = 36;
            return tx.calNetworkFee();

          case 36:
            networkFee = _context.sent;
            output = tx.outputs.find(function (v) {
              return v.address === toAddress;
            });

            if (!(output.value < networkFee)) {
              _context.next = 40;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(networkFee) + " BTC as network fee");

          case 40:
            output.value -= networkFee;
            _context.next = 54;
            break;

          case 43:
            _unspent = tx.getUnspent();

            if (!(_unspent <= 0)) {
              _context.next = 46;
              break;
            }

            throw new Error("Balance not enough to pay network fee.");

          case 46:
            // add dummy output
            tx.addChangeOutput(1);
            _context.next = 49;
            return tx.calNetworkFee();

          case 49:
            _networkFee = _context.sent;

            if (!(_unspent < _networkFee)) {
              _context.next = 52;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(_networkFee) + " BTC as network fee, but only " + satoshisToAmount(_unspent) + " BTC.");

          case 52:
            leftAmount = _unspent - _networkFee;

            if (leftAmount >= UTXO_DUST) {
              // change dummy output to true output
              tx.getChangeOutput().value = leftAmount;
            } else {
              // remove dummy output
              tx.removeChangeOutput();
            }

          case 54:
            _context.next = 56;
            return tx.createSignedPsbt();

          case 56:
            psbt = _context.sent;

            if (dump) {
              tx.dumpTx(psbt);
            }

            return _context.abrupt("return", psbt);

          case 59:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _createSendBTC.apply(this, arguments);
}

export function createSendOrd(_x2) {
  return _createSendOrd.apply(this, arguments);
}

function _createSendOrd() {
  _createSendOrd = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(_ref2) {
    var utxos, toAddress, toOrdId, wallet, network, changeAddress, pubkey, feeRate, outputValue, dump, _ref2$enableRBF, enableRBF, tx, nonOrdUtxos, ordUtxos, found, i, ordUtxo, outputAmount, tmpSum, _i, nonOrdUtxo, fee, unspent, networkFee, leftAmount, psbt;

    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            utxos = _ref2.utxos, toAddress = _ref2.toAddress, toOrdId = _ref2.toOrdId, wallet = _ref2.wallet, network = _ref2.network, changeAddress = _ref2.changeAddress, pubkey = _ref2.pubkey, feeRate = _ref2.feeRate, outputValue = _ref2.outputValue, dump = _ref2.dump, _ref2$enableRBF = _ref2.enableRBF, enableRBF = _ref2$enableRBF === void 0 ? true : _ref2$enableRBF;
            tx = new OrdTransaction(wallet, network, pubkey, feeRate);
            tx.setEnableRBF(enableRBF);
            tx.setChangeAddress(changeAddress);
            nonOrdUtxos = [];
            ordUtxos = [];
            utxos.forEach(function (v) {
              if (v.ords.length > 0) {
                ordUtxos.push(v);
              } else {
                nonOrdUtxos.push(v);
              }
            }); // find NFT

            found = false;
            i = 0;

          case 9:
            if (!(i < ordUtxos.length)) {
              _context2.next = 21;
              break;
            }

            ordUtxo = ordUtxos[i];

            if (!ordUtxo.ords.find(function (v) {
              return v.id == toOrdId;
            })) {
              _context2.next = 18;
              break;
            }

            if (!(ordUtxo.ords.length > 1)) {
              _context2.next = 14;
              break;
            }

            throw new Error("Multiple inscriptions! Please split them first.");

          case 14:
            tx.addInput(ordUtxo);
            tx.addOutput(toAddress, ordUtxo.satoshis);
            found = true;
            return _context2.abrupt("break", 21);

          case 18:
            i++;
            _context2.next = 9;
            break;

          case 21:
            if (found) {
              _context2.next = 23;
              break;
            }

            throw new Error("inscription not found.");

          case 23:
            // format NFT
            tx.outputs[0].value = outputValue; // select non ord utxo

            outputAmount = tx.getTotalOutput();
            tmpSum = tx.getTotalInput();
            _i = 0;

          case 27:
            if (!(_i < nonOrdUtxos.length)) {
              _context2.next = 45;
              break;
            }

            nonOrdUtxo = nonOrdUtxos[_i];

            if (!(tmpSum < outputAmount)) {
              _context2.next = 33;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            return _context2.abrupt("continue", 42);

          case 33:
            _context2.next = 35;
            return tx.calNetworkFee();

          case 35:
            fee = _context2.sent;

            if (!(tmpSum < outputAmount + fee)) {
              _context2.next = 41;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            _context2.next = 42;
            break;

          case 41:
            return _context2.abrupt("break", 45);

          case 42:
            _i++;
            _context2.next = 27;
            break;

          case 45:
            unspent = tx.getUnspent();

            if (!(unspent <= 0)) {
              _context2.next = 48;
              break;
            }

            throw new Error("Balance not enough to pay network fee.");

          case 48:
            // add dummy output
            tx.addChangeOutput(1);
            _context2.next = 51;
            return tx.calNetworkFee();

          case 51:
            networkFee = _context2.sent;

            if (!(unspent < networkFee)) {
              _context2.next = 54;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(networkFee) + " BTC as network fee, but only " + satoshisToAmount(unspent) + " BTC.");

          case 54:
            leftAmount = unspent - networkFee;

            if (leftAmount >= UTXO_DUST) {
              // change dummy output to true output
              tx.getChangeOutput().value = leftAmount;
            } else {
              // remove dummy output
              tx.removeChangeOutput();
            }

            _context2.next = 58;
            return tx.createSignedPsbt();

          case 58:
            psbt = _context2.sent;

            if (dump) {
              tx.dumpTx(psbt);
            }

            return _context2.abrupt("return", psbt);

          case 61:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _createSendOrd.apply(this, arguments);
}

export function createSendMultiOrds(_x3) {
  return _createSendMultiOrds.apply(this, arguments);
}

function _createSendMultiOrds() {
  _createSendMultiOrds = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(_ref3) {
    var utxos, toAddress, toOrdIds, wallet, network, changeAddress, pubkey, feeRate, dump, _ref3$enableRBF, enableRBF, tx, nonOrdUtxos, ordUtxos, foundedCount, i, ordUtxo, outputAmount, tmpSum, _i2, nonOrdUtxo, fee, unspent, networkFee, leftAmount, psbt;

    return _regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            utxos = _ref3.utxos, toAddress = _ref3.toAddress, toOrdIds = _ref3.toOrdIds, wallet = _ref3.wallet, network = _ref3.network, changeAddress = _ref3.changeAddress, pubkey = _ref3.pubkey, feeRate = _ref3.feeRate, dump = _ref3.dump, _ref3$enableRBF = _ref3.enableRBF, enableRBF = _ref3$enableRBF === void 0 ? true : _ref3$enableRBF;
            tx = new OrdTransaction(wallet, network, pubkey, feeRate);
            tx.setEnableRBF(enableRBF);
            tx.setChangeAddress(changeAddress);
            nonOrdUtxos = [];
            ordUtxos = [];
            utxos.forEach(function (v) {
              if (v.ords.length > 0) {
                ordUtxos.push(v);
              } else {
                nonOrdUtxos.push(v);
              }
            }); // find NFT

            foundedCount = 0;
            i = 0;

          case 9:
            if (!(i < ordUtxos.length)) {
              _context3.next = 20;
              break;
            }

            ordUtxo = ordUtxos[i];

            if (!ordUtxo.ords.find(function (v) {
              return toOrdIds.includes(v.id);
            })) {
              _context3.next = 17;
              break;
            }

            if (!(ordUtxo.ords.length > 1)) {
              _context3.next = 14;
              break;
            }

            throw new Error("Multiple inscriptions in one UTXO! Please split them first.");

          case 14:
            tx.addInput(ordUtxo);
            tx.addOutput(toAddress, ordUtxo.satoshis);
            foundedCount++;

          case 17:
            i++;
            _context3.next = 9;
            break;

          case 20:
            if (!(foundedCount != toOrdIds.length)) {
              _context3.next = 22;
              break;
            }

            throw new Error("inscription not found.");

          case 22:
            // Do not format NFT
            // tx.outputs[0].value = outputValue;
            // select non ord utxo
            outputAmount = tx.getTotalOutput();
            tmpSum = tx.getTotalInput();
            _i2 = 0;

          case 25:
            if (!(_i2 < nonOrdUtxos.length)) {
              _context3.next = 43;
              break;
            }

            nonOrdUtxo = nonOrdUtxos[_i2];

            if (!(tmpSum < outputAmount)) {
              _context3.next = 31;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            return _context3.abrupt("continue", 40);

          case 31:
            _context3.next = 33;
            return tx.calNetworkFee();

          case 33:
            fee = _context3.sent;

            if (!(tmpSum < outputAmount + fee)) {
              _context3.next = 39;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            _context3.next = 40;
            break;

          case 39:
            return _context3.abrupt("break", 43);

          case 40:
            _i2++;
            _context3.next = 25;
            break;

          case 43:
            unspent = tx.getUnspent();

            if (!(unspent <= 0)) {
              _context3.next = 46;
              break;
            }

            throw new Error("Balance not enough to pay network fee.");

          case 46:
            // add dummy output
            tx.addChangeOutput(1);
            _context3.next = 49;
            return tx.calNetworkFee();

          case 49:
            networkFee = _context3.sent;

            if (!(unspent < networkFee)) {
              _context3.next = 52;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(networkFee) + " BTC as network fee, but only " + satoshisToAmount(unspent) + " BTC.");

          case 52:
            leftAmount = unspent - networkFee;

            if (leftAmount >= UTXO_DUST) {
              // change dummy output to true output
              tx.getChangeOutput().value = leftAmount;
            } else {
              // remove dummy output
              tx.removeChangeOutput();
            }

            _context3.next = 56;
            return tx.createSignedPsbt();

          case 56:
            psbt = _context3.sent;

            if (dump) {
              tx.dumpTx(psbt);
            }

            return _context3.abrupt("return", psbt);

          case 59:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _createSendMultiOrds.apply(this, arguments);
}

export function createSendMultiBTC(_x4) {
  return _createSendMultiBTC.apply(this, arguments);
}

function _createSendMultiBTC() {
  _createSendMultiBTC = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(_ref4) {
    var utxos, receivers, wallet, network, changeAddress, feeRate, pubkey, dump, _ref4$enableRBF, enableRBF, tx, nonOrdUtxos, ordUtxos, outputAmount, tmpSum, i, nonOrdUtxo, fee, unspent, networkFee, leftAmount, psbt;

    return _regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            utxos = _ref4.utxos, receivers = _ref4.receivers, wallet = _ref4.wallet, network = _ref4.network, changeAddress = _ref4.changeAddress, feeRate = _ref4.feeRate, pubkey = _ref4.pubkey, dump = _ref4.dump, _ref4$enableRBF = _ref4.enableRBF, enableRBF = _ref4$enableRBF === void 0 ? true : _ref4$enableRBF;
            tx = new OrdTransaction(wallet, network, pubkey, feeRate);
            tx.setEnableRBF(enableRBF);
            tx.setChangeAddress(changeAddress);
            nonOrdUtxos = [];
            ordUtxos = [];
            utxos.forEach(function (v) {
              if (v.ords.length > 0) {
                ordUtxos.push(v);
              } else {
                nonOrdUtxos.push(v);
              }
            });
            receivers.forEach(function (v) {
              tx.addOutput(v.address, v.amount);
            });
            outputAmount = tx.getTotalOutput();
            tmpSum = tx.getTotalInput();
            i = 0;

          case 11:
            if (!(i < nonOrdUtxos.length)) {
              _context4.next = 29;
              break;
            }

            nonOrdUtxo = nonOrdUtxos[i];

            if (!(tmpSum < outputAmount)) {
              _context4.next = 17;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            return _context4.abrupt("continue", 26);

          case 17:
            _context4.next = 19;
            return tx.calNetworkFee();

          case 19:
            fee = _context4.sent;

            if (!(tmpSum < outputAmount + fee)) {
              _context4.next = 25;
              break;
            }

            tx.addInput(nonOrdUtxo);
            tmpSum += nonOrdUtxo.satoshis;
            _context4.next = 26;
            break;

          case 25:
            return _context4.abrupt("break", 29);

          case 26:
            i++;
            _context4.next = 11;
            break;

          case 29:
            if (!(nonOrdUtxos.length === 0)) {
              _context4.next = 31;
              break;
            }

            throw new Error("Balance not enough");

          case 31:
            unspent = tx.getUnspent();

            if (!(unspent <= 0)) {
              _context4.next = 34;
              break;
            }

            throw new Error("Balance not enough to pay network fee.");

          case 34:
            // add dummy output
            tx.addChangeOutput(1);
            _context4.next = 37;
            return tx.calNetworkFee();

          case 37:
            networkFee = _context4.sent;

            if (!(unspent < networkFee)) {
              _context4.next = 40;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(networkFee) + " BTC as network fee, but only " + satoshisToAmount(unspent) + " BTC.");

          case 40:
            leftAmount = unspent - networkFee;

            if (leftAmount >= UTXO_DUST) {
              // change dummy output to true output
              tx.getChangeOutput().value = leftAmount;
            } else {
              // remove dummy output
              tx.removeChangeOutput();
            }

            _context4.next = 44;
            return tx.createSignedPsbt();

          case 44:
            psbt = _context4.sent;

            if (dump) {
              tx.dumpTx(psbt);
            }

            return _context4.abrupt("return", psbt);

          case 47:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _createSendMultiBTC.apply(this, arguments);
}

export function createSplitOrdUtxo(_x5) {
  return _createSplitOrdUtxo.apply(this, arguments);
}

function _createSplitOrdUtxo() {
  _createSplitOrdUtxo = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(_ref5) {
    var utxos, wallet, network, changeAddress, pubkey, feeRate, dump, _ref5$enableRBF, enableRBF, _ref5$outputValue, outputValue, _yield$createSplitOrd, psbt;

    return _regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            utxos = _ref5.utxos, wallet = _ref5.wallet, network = _ref5.network, changeAddress = _ref5.changeAddress, pubkey = _ref5.pubkey, feeRate = _ref5.feeRate, dump = _ref5.dump, _ref5$enableRBF = _ref5.enableRBF, enableRBF = _ref5$enableRBF === void 0 ? true : _ref5$enableRBF, _ref5$outputValue = _ref5.outputValue, outputValue = _ref5$outputValue === void 0 ? 546 : _ref5$outputValue;
            _context5.next = 3;
            return createSplitOrdUtxoV2({
              utxos: utxos,
              wallet: wallet,
              network: network,
              changeAddress: changeAddress,
              pubkey: pubkey,
              feeRate: feeRate,
              dump: dump,
              enableRBF: enableRBF,
              outputValue: outputValue
            });

          case 3:
            _yield$createSplitOrd = _context5.sent;
            psbt = _yield$createSplitOrd.psbt;
            return _context5.abrupt("return", psbt);

          case 6:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _createSplitOrdUtxo.apply(this, arguments);
}

export function createSplitOrdUtxoV2(_x6) {
  return _createSplitOrdUtxoV.apply(this, arguments);
}

function _createSplitOrdUtxoV() {
  _createSplitOrdUtxoV = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(_ref6) {
    var utxos, wallet, network, changeAddress, pubkey, feeRate, dump, _ref6$enableRBF, enableRBF, _ref6$outputValue, outputValue, tx, nonOrdUtxos, ordUtxos, lastUnit, splitedCount, i, ordUtxo, tmpOutputCounts, j, unit, outputAmount, tmpSum, _i3, nonOrdUtxo, fee, unspent, networkFee, leftAmount, psbt;

    return _regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            utxos = _ref6.utxos, wallet = _ref6.wallet, network = _ref6.network, changeAddress = _ref6.changeAddress, pubkey = _ref6.pubkey, feeRate = _ref6.feeRate, dump = _ref6.dump, _ref6$enableRBF = _ref6.enableRBF, enableRBF = _ref6$enableRBF === void 0 ? true : _ref6$enableRBF, _ref6$outputValue = _ref6.outputValue, outputValue = _ref6$outputValue === void 0 ? 546 : _ref6$outputValue;
            tx = new OrdTransaction(wallet, network, pubkey, feeRate);
            tx.setEnableRBF(enableRBF);
            tx.setChangeAddress(changeAddress);
            nonOrdUtxos = [];
            ordUtxos = [];
            utxos.forEach(function (v) {
              var ordUtxo = new OrdUnspendOutput(v, outputValue);

              if (v.ords.length > 0) {
                ordUtxos.push(ordUtxo);
              } else {
                nonOrdUtxos.push(ordUtxo);
              }
            });
            ordUtxos.sort(function (a, b) {
              return a.getLastUnitSatoshis() - b.getLastUnitSatoshis();
            });
            lastUnit = null;
            splitedCount = 0;
            i = 0;

          case 11:
            if (!(i < ordUtxos.length)) {
              _context6.next = 33;
              break;
            }

            ordUtxo = ordUtxos[i];

            if (!ordUtxo.hasOrd()) {
              _context6.next = 30;
              break;
            }

            tx.addInput(ordUtxo.utxo);
            tmpOutputCounts = 0;
            j = 0;

          case 17:
            if (!(j < ordUtxo.ordUnits.length)) {
              _context6.next = 30;
              break;
            }

            unit = ordUtxo.ordUnits[j];

            if (!unit.hasOrd()) {
              _context6.next = 25;
              break;
            }

            tx.addChangeOutput(unit.satoshis);
            lastUnit = unit;
            tmpOutputCounts++;
            splitedCount++;
            return _context6.abrupt("continue", 27);

          case 25:
            tx.addChangeOutput(unit.satoshis);
            lastUnit = unit;

          case 27:
            j++;
            _context6.next = 17;
            break;

          case 30:
            i++;
            _context6.next = 11;
            break;

          case 33:
            if (!lastUnit.hasOrd()) {
              tx.removeChangeOutput();
            }

            if (lastUnit.satoshis < UTXO_DUST) {
              lastUnit.satoshis = UTXO_DUST;
            } // select non ord utxo


            outputAmount = tx.getTotalOutput();
            tmpSum = tx.getTotalInput();
            _i3 = 0;

          case 38:
            if (!(_i3 < nonOrdUtxos.length)) {
              _context6.next = 56;
              break;
            }

            nonOrdUtxo = nonOrdUtxos[_i3];

            if (!(tmpSum < outputAmount)) {
              _context6.next = 44;
              break;
            }

            tx.addInput(nonOrdUtxo.utxo);
            tmpSum += nonOrdUtxo.utxo.satoshis;
            return _context6.abrupt("continue", 53);

          case 44:
            _context6.next = 46;
            return tx.calNetworkFee();

          case 46:
            fee = _context6.sent;

            if (!(tmpSum < outputAmount + fee)) {
              _context6.next = 52;
              break;
            }

            tx.addInput(nonOrdUtxo.utxo);
            tmpSum += nonOrdUtxo.utxo.satoshis;
            _context6.next = 53;
            break;

          case 52:
            return _context6.abrupt("break", 56);

          case 53:
            _i3++;
            _context6.next = 38;
            break;

          case 56:
            unspent = tx.getUnspent();

            if (!(unspent <= 0)) {
              _context6.next = 59;
              break;
            }

            throw new Error("Balance not enough to pay network fee.");

          case 59:
            // add dummy output
            tx.addChangeOutput(1);
            _context6.next = 62;
            return tx.calNetworkFee();

          case 62:
            networkFee = _context6.sent;

            if (!(unspent < networkFee)) {
              _context6.next = 65;
              break;
            }

            throw new Error("Balance not enough. Need " + satoshisToAmount(networkFee) + " BTC as network fee, but only " + satoshisToAmount(unspent) + " BTC.");

          case 65:
            leftAmount = unspent - networkFee;

            if (leftAmount >= UTXO_DUST) {
              // change dummy output to true output
              tx.getChangeOutput().value = leftAmount;
            } else {
              // remove dummy output
              tx.removeChangeOutput();
            }

            _context6.next = 69;
            return tx.createSignedPsbt();

          case 69:
            psbt = _context6.sent;

            if (dump) {
              tx.dumpTx(psbt);
            }

            return _context6.abrupt("return", {
              psbt: psbt,
              splitedCount: splitedCount
            });

          case 72:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return _createSplitOrdUtxoV.apply(this, arguments);
}