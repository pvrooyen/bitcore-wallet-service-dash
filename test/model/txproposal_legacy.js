'use strict';

var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');
var should = chai.should();
var TxProposal = require('../../lib/model/txproposal_legacy');
var Bitcore = require('bitcore-lib-dash');

describe('TXProposal legacy', function() {

  describe('#create', function() {
    it('should create a TxProposal', function() {
      var txp = TxProposal.create(aTxpOpts());
      should.exist(txp);
      should.exist(txp.toAddress);
      should.not.exist(txp.outputs);
    });
    it('should create a multiple-outputs TxProposal', function() {
      var txp = TxProposal.create(aTxpOpts(TxProposal.Types.MULTIPLEOUTPUTS));
      should.exist(txp);
      should.not.exist(txp.toAddress);
      should.exist(txp.outputs);
    });
    it('should create an external TxProposal', function() {
      var txp = TxProposal.create(aTxpOpts(TxProposal.Types.EXTERNAL));
      should.exist(txp);
      should.not.exist(txp.toAddress);
      should.exist(txp.outputs);
      should.exist(txp.inputs);
    });
  });

  describe('#fromObj', function() {
    it('should copy a TxProposal', function() {
      var txp = TxProposal.fromObj(aTXP());
      should.exist(txp);
      txp.toAddress.should.equal(aTXP().toAddress);
    });
    it('should copy a multiple-outputs TxProposal', function() {
      var txp = TxProposal.fromObj(aTXP(TxProposal.Types.MULTIPLEOUTPUTS));
      should.exist(txp);
      txp.outputs.should.deep.equal(aTXP(TxProposal.Types.MULTIPLEOUTPUTS).outputs);
    });
  });

  describe('#getBitcoreTx', function() {
    it('should create a valid bitcore TX', function() {
      var txp = TxProposal.fromObj(aTXP());
      var t = txp.getBitcoreTx();
      should.exist(t);
    });
    it('should order outputs as specified by outputOrder', function() {
      var txp = TxProposal.fromObj(aTXP());

      txp.outputOrder = [0, 1];
      var t = txp.getBitcoreTx();
      t.getChangeOutput().should.deep.equal(t.outputs[1]);

      txp.outputOrder = [1, 0];
      var t = txp.getBitcoreTx();
      t.getChangeOutput().should.deep.equal(t.outputs[0]);
    });
    it('should create a bitcore TX with multiple outputs', function() {
      var txp = TxProposal.fromObj(aTXP(TxProposal.Types.MULTIPLEOUTPUTS));
      txp.outputOrder = [0, 1, 2];
      var t = txp.getBitcoreTx();
      t.getChangeOutput().should.deep.equal(t.outputs[2]);
    });
  });

  describe('#getTotalAmount', function() {
    it('should be compatible with simple proposal legacy amount', function() {
      var x = TxProposal.fromObj(aTXP());
      var total = x.getTotalAmount();
      total.should.equal(x.amount);
    });
    it('should handle multiple-outputs', function() {
      var x = TxProposal.fromObj(aTXP(TxProposal.Types.MULTIPLEOUTPUTS));
      var totalOutput = 0;
      _.each(x.outputs, function(o) {
        totalOutput += o.amount
      });
      x.getTotalAmount().should.equal(totalOutput);
    });
    it('should handle external', function() {
      var x = TxProposal.fromObj(aTXP(TxProposal.Types.EXTERNAL));
      var totalOutput = 0;
      _.each(x.outputs, function(o) {
        totalOutput += o.amount
      });
      x.getTotalAmount().should.equal(totalOutput);
    });

  });

  describe('#sign', function() {
    it('should sign 2-2', function() {
      var txp = TxProposal.fromObj(aTXP());
      txp.sign('1', theSignatures2, theXPub2);
      txp.isAccepted().should.equal(false);
      txp.isRejected().should.equal(false);
      txp.sign('2', theSignatures2, theXPub2);
      txp.isAccepted().should.equal(true);
      txp.isRejected().should.equal(false);
    });
  });

  describe('#getRawTx', function() {
    it('should generate correct raw transaction for signed 2-2', function() {
      var txp = TxProposal.fromObj(aTXP());
      txp.sign('1', theSignatures1, theXPub1);
      txp.getRawTx().should.equal('01000000013768fb3473c0f10758abc1fda4ef8c54f059003f2d448968c0ad804c4dcf0b48000000004900475221029153fd3f81a098634e7439fe7acf18a0464b6518fbf693b4c9f17b599a079ad82103f39e325ed77e2a95986f595042b8b3208382d1e74ea5b24831c67280a21ace6752aeffffffff0280c3c901000000001976a914f4d7feb11bc143018d55a463e3690703a9d9352188acd0e6e2441700000017a91403d4b30b14cafa3047955b2764586d40b105733c8700000000');
    });
  });



  describe('#reject', function() {
    it('should reject 2-2', function() {
      var txp = TxProposal.fromObj(aTXP());
      txp.reject('1');
      txp.isAccepted().should.equal(false);
      txp.isRejected().should.equal(true);
    });
  });


  describe('#reject & #sign', function() {
    it('should finally reject', function() {
      var txp = TxProposal.fromObj(aTXP());
      txp.sign('1', theSignatures2);
      txp.isAccepted().should.equal(false);
      txp.isRejected().should.equal(false);
      txp.reject('2');
      txp.isAccepted().should.equal(false);
      txp.isRejected().should.equal(true);
    });
  });

});

var theXPriv1 = 'tprv8ZgxMBicQKsPeHCsHwzRrTjL6HMsS7rozDWtQvCYNjuDBjgFQJTUKrfjPmj8gDmLa2tH7ZSc4Z4e8xLAP7Cy49v2EiW3mJpqkuxA2gSAUNA';
var theXPub1 = 'tpubDDTaaaSM1Ga2NKTdr8i3NYRanNsQga3q57pfNrRNB8hqz7RMvSiQohu38HNEmSFWiPHbuPNbvKYfSWQZFTfAhxYy1icWwVVvxAjNeWpubwS';
var theSignatures1 = ['304502210089951aa097679be899866973826b1402f08efc10ba38a169a6262a6b17b0dab302206f5a2d840b225137503596f6350929fe7b36897dddcb3cf55e7defb2410be6bf'];

var theXPriv2 = 'tprv8ZgxMBicQKsPdELFtySdCVwuwQnN1xmvDZ67S5TQCSBNPeGWgju8XxSBotbbfkmvDEvCsDrBuUjye4iTLANwRze8auAZ1raBxnduHPASf5Z';
var theXPub2 = 'tpubDDb5nCWVNuPEbm9ztztimbb5PfZQmMJx4d1r4WaXfkTeTu6kVfToQL2CK5sGgyNPRcr9SmisQTe8kcd2jEh74i4N2UqfGthYvZgTkfRczFX';
var theSignatures2 = ['3045022100da1d7e668ca6da193a56dcad9fc65c968b754519b0844fd59a3be2cf003de9a50220025bd2d1f7dedff569e0ac3e685eea999d2cfb7378a6483c3233cdb4110fb68c'];

var aTxpOpts = function(type) {
  var opts = {
    type: type,
    toAddress: 'yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm',
    amount: 50000000,
    message: 'some message'
  };
  if (type == TxProposal.Types.MULTIPLEOUTPUTS || type == TxProposal.Types.EXTERNAL) {
    opts.outputs = [{
      toAddress: "yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm",
      amount: 10000000,
      message: "first message"
    }, {
      toAddress: "yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm",
      amount: 20000000,
      message: "second message"
    }, ];
    delete opts.toAddress;
    delete opts.amount;
  }
  if (type == TxProposal.Types.EXTERNAL) {
    opts.inputs = [{
      "txid": "6ee699846d2d6605f96d20c7cc8230382e5da43342adb11b499bbe73709f06ab",
      "vout": 8,
      "satoshis": 100000000,
      "scriptPubKey": "a914a8a9648754fbda1b6c208ac9d4e252075447f36887",
      "address": "3H4pNP6J4PW4NnvdrTg37VvZ7h2QWuAwtA",
      "path": "m/2147483647/0/1",
      "publicKeys": ["0319008ffe1b3e208f5ebed8f46495c056763f87b07930a7027a92ee477fb0cb0f", "03b5f035af8be40d0db5abb306b7754949ab39032cf99ad177691753b37d101301"]
    }];
  }
  return opts;
};

var aTXP = function(type) {
  var txp = {
    "version": '2.0.0',
    "type": type,
    "createdOn": 1423146231,
    "id": "75c34f49-1ed6-255f-e9fd-0c71ae75ed1e",
    "walletId": "1",
    "creatorId": "1",
    "toAddress": "yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm",
    "network": "testnet",
    "amount": 30000000,
    "message": 'some message',
    "proposalSignature": '304402201cf9f446d9d0cbcf075186ce1df2ac0e25a1f76a939518f2e0e365eefd729c4602203503fb852619d62697624d42960f2c03784cd2d47a7a8005e44c937ffab09600',
    "changeAddress": {
      "version": '1.0.0',
      "createdOn": 1475385139,
      "address": '8emiYFa4FG2CrY2YKbdbUNdWV2EEtw3swq',
      "path": 'm/1/9',
      "publicKeys": ['0297e50b5db89d18f1115e2c35b3c101ac2812658ba95a1a84fe2505b52a0aa655',
        '02406072e42e4f03940de60ad3386ed243d718f8ae0e5ae8a28d6418be95034f3a'
      ]
    },
    "inputs": [{
      "txid": "480bcf4d4c80adc06889442d3f0059f0548cefa4fdc1ab5807f1c07334fb6837",
      "vout": 0,
      "satoshis": 99969984360,
      "scriptPubKey": "a91422cece6b0e08688ba7c7ad4e1b1f6dbb0ad80cb987",
      "address": "8hbWRjx1CWXx1J65ZmZxUShb2PYMXWNok4",
      "path": "m/1/4",
      "publicKeys": ["03f39e325ed77e2a95986f595042b8b3208382d1e74ea5b24831c67280a21ace67", "029153fd3f81a098634e7439fe7acf18a0464b6518fbf693b4c9f17b599a079ad8"]
    }],
    "inputPaths": ["m/1/4"],
    "requiredSignatures": 2,
    "requiredRejections": 1,
    "walletN": 2,
    "status": "pending",
    "actions": [],
    "outputOrder": [0, 1, 2],
    "fee": 15640,
  };
  if (type == TxProposal.Types.MULTIPLEOUTPUTS) {
    txp.outputs = [{
      toAddress: "yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm",
      amount: 10000000,
      message: "first message"
    }, {
      toAddress: "yie4Ubd2ieCdzqwNyAc8QRutfri3E9ChTm",
      amount: 20000000,
      message: "second message"
    }, ];
    txp.outputOrder = [0, 1, 2];
    delete txp.toAddress;
    delete txp.amount;
  }
  return txp;
};
