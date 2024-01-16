"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSplitOrdUtxoV2 = exports.createSplitOrdUtxo = exports.createSendMultiBTC = exports.createSendMultiOrds = exports.createSendOrd = exports.createSendBTC = void 0;
const OrdTransaction_1 = require("./OrdTransaction");
const OrdUnspendOutput_1 = require("./OrdUnspendOutput");
const utils_1 = require("./utils");
function createSendBTC({ utxos, toAddress, toAmount, wallet, network, changeAddress, receiverToPayFee, feeRate, pubkey, dump, enableRBF = true, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new OrdTransaction_1.OrdTransaction(wallet, network, pubkey, feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        tx.addOutput(toAddress, toAmount);
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        if (nonOrdUtxos.length === 0) {
            throw new Error("Balance not enough");
        }
        if (receiverToPayFee) {
            const unspent = tx.getUnspent();
            if (unspent >= OrdUnspendOutput_1.UTXO_DUST) {
                tx.addChangeOutput(unspent);
            }
            const networkFee = yield tx.calNetworkFee();
            const output = tx.outputs.find((v) => v.address === toAddress);
            if (output.value < networkFee) {
                throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee`);
            }
            output.value -= networkFee;
        }
        else {
            const unspent = tx.getUnspent();
            if (unspent <= 0) {
                throw new Error("Balance not enough to pay network fee.");
            }
            // add dummy output
            tx.addChangeOutput(1);
            const networkFee = yield tx.calNetworkFee();
            if (unspent < networkFee) {
                throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee, but only ${(0, utils_1.satoshisToAmount)(unspent)} BTC.`);
            }
            const leftAmount = unspent - networkFee;
            if (leftAmount >= OrdUnspendOutput_1.UTXO_DUST) {
                // change dummy output to true output
                tx.getChangeOutput().value = leftAmount;
            }
            else {
                // remove dummy output
                tx.removeChangeOutput();
            }
        }
        const psbt = yield tx.createSignedPsbt();
        if (dump) {
            tx.dumpTx(psbt);
        }
        return psbt;
    });
}
exports.createSendBTC = createSendBTC;
function createSendOrd({ utxos, toAddress, toOrdId, wallet, network, changeAddress, pubkey, feeRate, outputValue, dump, enableRBF = true, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new OrdTransaction_1.OrdTransaction(wallet, network, pubkey, feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        // find NFT
        let found = false;
        for (let i = 0; i < ordUtxos.length; i++) {
            const ordUtxo = ordUtxos[i];
            if (ordUtxo.ords.find((v) => v.id == toOrdId)) {
                if (ordUtxo.ords.length > 1) {
                    throw new Error("Multiple inscriptions! Please split them first.");
                }
                tx.addInput(ordUtxo);
                tx.addOutput(toAddress, ordUtxo.satoshis);
                found = true;
                break;
            }
        }
        if (!found) {
            throw new Error("inscription not found.");
        }
        // format NFT
        tx.outputs[0].value = outputValue;
        // select non ord utxo
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        const unspent = tx.getUnspent();
        if (unspent <= 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        // add dummy output
        tx.addChangeOutput(1);
        const networkFee = yield tx.calNetworkFee();
        if (unspent < networkFee) {
            throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee, but only ${(0, utils_1.satoshisToAmount)(unspent)} BTC.`);
        }
        const leftAmount = unspent - networkFee;
        if (leftAmount >= OrdUnspendOutput_1.UTXO_DUST) {
            // change dummy output to true output
            tx.getChangeOutput().value = leftAmount;
        }
        else {
            // remove dummy output
            tx.removeChangeOutput();
        }
        const psbt = yield tx.createSignedPsbt();
        if (dump) {
            tx.dumpTx(psbt);
        }
        return psbt;
    });
}
exports.createSendOrd = createSendOrd;
function createSendMultiOrds({ utxos, toAddress, toOrdIds, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF = true, }) {
    console.log('here...here...here...')
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new OrdTransaction_1.OrdTransaction(wallet, network, pubkey, feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        // find NFT
        let foundedCount = 0;
        for (let i = 0; i < ordUtxos.length; i++) {
            const ordUtxo = ordUtxos[i];
            if (ordUtxo.ords.find((v) => toOrdIds.includes(v.id))) {
                if (ordUtxo.ords.length > 1) {
                    throw new Error("Multiple inscriptions in one UTXO! Please split them first.");
                }
                tx.addInput(ordUtxo);
                tx.addOutput(toAddress, ordUtxo.satoshis);
                foundedCount++;
            }
        }
        if (foundedCount != toOrdIds.length) {
            throw new Error("inscription not found.");
        }
        // Do not format NFT
        // tx.outputs[0].value = outputValue;
        // select non ord utxo
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        const unspent = tx.getUnspent();
        if (unspent <= 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        // add dummy output
        tx.addChangeOutput(1);
        const networkFee = yield tx.calNetworkFee();
        if (unspent < networkFee) {
            throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee, but only ${(0, utils_1.satoshisToAmount)(unspent)} BTC.`);
        }
        const leftAmount = unspent - networkFee;
        if (leftAmount >= OrdUnspendOutput_1.UTXO_DUST) {
            // change dummy output to true output
            tx.getChangeOutput().value = leftAmount;
        }
        else {
            // remove dummy output
            tx.removeChangeOutput();
        }
        const psbt = yield tx.createSignedPsbt();
        if (dump) {
            tx.dumpTx(psbt);
        }
        return psbt;
    });
}
exports.createSendMultiOrds = createSendMultiOrds;
function createSendMultiBTC({ utxos, receivers, wallet, network, changeAddress, feeRate, pubkey, dump, enableRBF = true, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new OrdTransaction_1.OrdTransaction(wallet, network, pubkey, feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            if (v.ords.length > 0) {
                ordUtxos.push(v);
            }
            else {
                nonOrdUtxos.push(v);
            }
        });
        receivers.forEach((v) => {
            tx.addOutput(v.address, v.amount);
        });
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo);
                tmpSum += nonOrdUtxo.satoshis;
            }
            else {
                break;
            }
        }
        if (nonOrdUtxos.length === 0) {
            throw new Error("Balance not enough");
        }
        const unspent = tx.getUnspent();
        if (unspent <= 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        // add dummy output
        tx.addChangeOutput(1);
        const networkFee = yield tx.calNetworkFee();
        if (unspent < networkFee) {
            throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee, but only ${(0, utils_1.satoshisToAmount)(unspent)} BTC.`);
        }
        const leftAmount = unspent - networkFee;
        if (leftAmount >= OrdUnspendOutput_1.UTXO_DUST) {
            // change dummy output to true output
            tx.getChangeOutput().value = leftAmount;
        }
        else {
            // remove dummy output
            tx.removeChangeOutput();
        }
        const psbt = yield tx.createSignedPsbt();
        if (dump) {
            tx.dumpTx(psbt);
        }
        return psbt;
    });
}
exports.createSendMultiBTC = createSendMultiBTC;
function createSplitOrdUtxo({ utxos, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF = true, outputValue = 546, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { psbt } = yield createSplitOrdUtxoV2({
            utxos,
            wallet,
            network,
            changeAddress,
            pubkey,
            feeRate,
            dump,
            enableRBF,
            outputValue,
        });
        return psbt;
    });
}
exports.createSplitOrdUtxo = createSplitOrdUtxo;
function createSplitOrdUtxoV2({ utxos, wallet, network, changeAddress, pubkey, feeRate, dump, enableRBF = true, outputValue = 546, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new OrdTransaction_1.OrdTransaction(wallet, network, pubkey, feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const nonOrdUtxos = [];
        const ordUtxos = [];
        utxos.forEach((v) => {
            const ordUtxo = new OrdUnspendOutput_1.OrdUnspendOutput(v, outputValue);
            if (v.ords.length > 0) {
                ordUtxos.push(ordUtxo);
            }
            else {
                nonOrdUtxos.push(ordUtxo);
            }
        });
        ordUtxos.sort((a, b) => a.getLastUnitSatoshis() - b.getLastUnitSatoshis());
        let lastUnit = null;
        let splitedCount = 0;
        for (let i = 0; i < ordUtxos.length; i++) {
            const ordUtxo = ordUtxos[i];
            if (ordUtxo.hasOrd()) {
                tx.addInput(ordUtxo.utxo);
                let tmpOutputCounts = 0;
                for (let j = 0; j < ordUtxo.ordUnits.length; j++) {
                    const unit = ordUtxo.ordUnits[j];
                    if (unit.hasOrd()) {
                        tx.addChangeOutput(unit.satoshis);
                        lastUnit = unit;
                        tmpOutputCounts++;
                        splitedCount++;
                        continue;
                    }
                    tx.addChangeOutput(unit.satoshis);
                    lastUnit = unit;
                }
            }
        }
        if (!lastUnit.hasOrd()) {
            tx.removeChangeOutput();
        }
        if (lastUnit.satoshis < OrdUnspendOutput_1.UTXO_DUST) {
            lastUnit.satoshis = OrdUnspendOutput_1.UTXO_DUST;
        }
        // select non ord utxo
        const outputAmount = tx.getTotalOutput();
        let tmpSum = tx.getTotalInput();
        for (let i = 0; i < nonOrdUtxos.length; i++) {
            const nonOrdUtxo = nonOrdUtxos[i];
            if (tmpSum < outputAmount) {
                tx.addInput(nonOrdUtxo.utxo);
                tmpSum += nonOrdUtxo.utxo.satoshis;
                continue;
            }
            const fee = yield tx.calNetworkFee();
            if (tmpSum < outputAmount + fee) {
                tx.addInput(nonOrdUtxo.utxo);
                tmpSum += nonOrdUtxo.utxo.satoshis;
            }
            else {
                break;
            }
        }
        const unspent = tx.getUnspent();
        if (unspent <= 0) {
            throw new Error("Balance not enough to pay network fee.");
        }
        // add dummy output
        tx.addChangeOutput(1);
        const networkFee = yield tx.calNetworkFee();
        if (unspent < networkFee) {
            throw new Error(`Balance not enough. Need ${(0, utils_1.satoshisToAmount)(networkFee)} BTC as network fee, but only ${(0, utils_1.satoshisToAmount)(unspent)} BTC.`);
        }
        const leftAmount = unspent - networkFee;
        if (leftAmount >= OrdUnspendOutput_1.UTXO_DUST) {
            // change dummy output to true output
            tx.getChangeOutput().value = leftAmount;
        }
        else {
            // remove dummy output
            tx.removeChangeOutput();
        }
        const psbt = yield tx.createSignedPsbt();
        if (dump) {
            tx.dumpTx(psbt);
        }
        return { psbt, splitedCount };
    });
}
exports.createSplitOrdUtxoV2 = createSplitOrdUtxoV2;
