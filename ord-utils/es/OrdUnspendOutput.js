import { OrdUnit } from "./OrdUnit";
export var UTXO_DUST = 546;
export var OrdUnspendOutput = /*#__PURE__*/function () {
  function OrdUnspendOutput(utxo, outputValue) {
    this.utxo = utxo;
    this.split(utxo.satoshis, utxo.ords, outputValue);
  }

  var _proto = OrdUnspendOutput.prototype;

  _proto.split = function split(satoshis, ords, splitOutputValue) {
    if (splitOutputValue === void 0) {
      splitOutputValue = UTXO_DUST;
    }

    var ordUnits = [];
    var leftAmount = satoshis;

    for (var i = 0; i < ords.length; i++) {
      var id = ords[i].id;
      var offset = ords[i].offset;
      var usedSatoshis = satoshis - leftAmount;
      var curOffset = offset - usedSatoshis;

      if (curOffset < 0 || leftAmount < splitOutputValue) {
        if (ordUnits.length == 0) {
          ordUnits.push(new OrdUnit(leftAmount, [{
            id: id,
            outputOffset: offset,
            unitOffset: curOffset
          }]));
          leftAmount = 0;
        } else {
          // injected to previous
          var preUnit = ordUnits[ordUnits.length - 1];
          preUnit.ords.push({
            id: id,
            outputOffset: offset,
            unitOffset: preUnit.satoshis + curOffset
          });
          continue;
        }
      }

      if (leftAmount >= curOffset) {
        if (leftAmount > splitOutputValue * 2) {
          if (curOffset >= splitOutputValue) {
            ordUnits.push(new OrdUnit(curOffset, []));
            ordUnits.push(new OrdUnit(splitOutputValue, [{
              id: id,
              outputOffset: offset,
              unitOffset: 0
            }]));
          } else {
            ordUnits.push(new OrdUnit(curOffset + splitOutputValue, [{
              id: id,
              outputOffset: offset,
              unitOffset: curOffset
            }]));
          }
        } else {
          ordUnits.push(new OrdUnit(curOffset + splitOutputValue, [{
            id: id,
            outputOffset: offset,
            unitOffset: curOffset
          }]));
        }
      }

      leftAmount -= curOffset + splitOutputValue;
    }

    if (leftAmount > UTXO_DUST) {
      ordUnits.push(new OrdUnit(leftAmount, []));
    } else if (leftAmount > 0) {
      if (ordUnits.length > 0) {
        ordUnits[ordUnits.length - 1].satoshis += leftAmount;
      } else {
        ordUnits.push(new OrdUnit(leftAmount, []));
      }
    }

    this.ordUnits = ordUnits;
  }
  /**
   * Get non-Ord satoshis for spending
   */
  ;

  _proto.getNonOrdSatoshis = function getNonOrdSatoshis() {
    return this.ordUnits.filter(function (v) {
      return v.ords.length == 0;
    }).reduce(function (pre, cur) {
      return pre + cur.satoshis;
    }, 0);
  }
  /**
   * Get last non-ord satoshis for spending.
   * Only the last one is available
   * @returns
   */
  ;

  _proto.getLastUnitSatoshis = function getLastUnitSatoshis() {
    var last = this.ordUnits[this.ordUnits.length - 1];

    if (last.ords.length == 0) {
      return last.satoshis;
    }

    return 0;
  };

  _proto.hasOrd = function hasOrd() {
    return this.utxo.ords.length > 0;
  };

  _proto.dump = function dump() {
    this.ordUnits.forEach(function (v) {
      console.log("satoshis:", v.satoshis, "ords:", v.ords);
    });
  };

  return OrdUnspendOutput;
}();