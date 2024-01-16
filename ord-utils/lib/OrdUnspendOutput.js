"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdUnspendOutput = exports.UTXO_DUST = void 0;
const OrdUnit_1 = require("./OrdUnit");
exports.UTXO_DUST = 546;
class OrdUnspendOutput {
    constructor(utxo, outputValue) {
        this.utxo = utxo;
        this.split(utxo.satoshis, utxo.ords, outputValue);
    }
    split(satoshis, ords, splitOutputValue = exports.UTXO_DUST) {
        const ordUnits = [];
        let leftAmount = satoshis;
        for (let i = 0; i < ords.length; i++) {
            const id = ords[i].id;
            const offset = ords[i].offset;
            const usedSatoshis = satoshis - leftAmount;
            const curOffset = offset - usedSatoshis;
            if (curOffset < 0 || leftAmount < splitOutputValue) {
                if (ordUnits.length == 0) {
                    ordUnits.push(new OrdUnit_1.OrdUnit(leftAmount, [
                        {
                            id: id,
                            outputOffset: offset,
                            unitOffset: curOffset,
                        },
                    ]));
                    leftAmount = 0;
                }
                else {
                    // injected to previous
                    const preUnit = ordUnits[ordUnits.length - 1];
                    preUnit.ords.push({
                        id,
                        outputOffset: offset,
                        unitOffset: preUnit.satoshis + curOffset,
                    });
                    continue;
                }
            }
            if (leftAmount >= curOffset) {
                if (leftAmount > splitOutputValue * 2) {
                    if (curOffset >= splitOutputValue) {
                        ordUnits.push(new OrdUnit_1.OrdUnit(curOffset, []));
                        ordUnits.push(new OrdUnit_1.OrdUnit(splitOutputValue, [
                            {
                                id,
                                outputOffset: offset,
                                unitOffset: 0,
                            },
                        ]));
                    }
                    else {
                        ordUnits.push(new OrdUnit_1.OrdUnit(curOffset + splitOutputValue, [
                            {
                                id,
                                outputOffset: offset,
                                unitOffset: curOffset,
                            },
                        ]));
                    }
                }
                else {
                    ordUnits.push(new OrdUnit_1.OrdUnit(curOffset + splitOutputValue, [
                        { id, outputOffset: offset, unitOffset: curOffset },
                    ]));
                }
            }
            leftAmount -= curOffset + splitOutputValue;
        }
        if (leftAmount > exports.UTXO_DUST) {
            ordUnits.push(new OrdUnit_1.OrdUnit(leftAmount, []));
        }
        else if (leftAmount > 0) {
            if (ordUnits.length > 0) {
                ordUnits[ordUnits.length - 1].satoshis += leftAmount;
            }
            else {
                ordUnits.push(new OrdUnit_1.OrdUnit(leftAmount, []));
            }
        }
        this.ordUnits = ordUnits;
    }
    /**
     * Get non-Ord satoshis for spending
     */
    getNonOrdSatoshis() {
        return this.ordUnits
            .filter((v) => v.ords.length == 0)
            .reduce((pre, cur) => pre + cur.satoshis, 0);
    }
    /**
     * Get last non-ord satoshis for spending.
     * Only the last one is available
     * @returns
     */
    getLastUnitSatoshis() {
        const last = this.ordUnits[this.ordUnits.length - 1];
        if (last.ords.length == 0) {
            return last.satoshis;
        }
        return 0;
    }
    hasOrd() {
        return this.utxo.ords.length > 0;
    }
    dump() {
        this.ordUnits.forEach((v) => {
            console.log("satoshis:", v.satoshis, "ords:", v.ords);
        });
    }
}
exports.OrdUnspendOutput = OrdUnspendOutput;
