import {HEADER_LEN, Pdu} from "./pdu";

describe('Pdu', () => {
  let pdu: Pdu | null;

  beforeEach(() => {
    pdu = new Pdu();
  });

  afterEach(() => {
    pdu = null;
  });

  it('should write and read data correctly', () => {
    const body = new Uint8Array([1, 2, 3]);
    const commandId = 10;
    const seqNum = 1;
    const reversed = 0;
    pdu = pdu!
    pdu.writeData(body, commandId, seqNum, reversed);

    expect(pdu.getPbBody()).toEqual(body);
    expect(pdu.getPbBodyLength()).toBe(body.length);
    expect(pdu.getCommandId()).toBe(commandId);
    expect(pdu.getReversed()).toBe(reversed);
    expect(pdu.getSeqNum()).toBe(seqNum);

    const pbData = pdu.getPbData();
    expect(pbData.length).toBe(HEADER_LEN + body.length);

    const newPdu = new Pdu(pbData);
    expect(newPdu.getPbBody()).toEqual(body);
    expect(newPdu.getPbBodyLength()).toBe(body.length);
    expect(newPdu.getCommandId()).toBe(commandId);
    expect(newPdu.getReversed()).toBe(reversed);
    expect(newPdu.getSeqNum()).toBe(seqNum);
  });

});

describe('Pdu updateSeqNo', () => {
  let pdu: Pdu | null;

  beforeEach(() => {
    pdu = new Pdu();
  });

  afterEach(() => {
    pdu = null;
  });

  it('should update the sequence number correctly', () => {
    const seqNum = 10;
    pdu = pdu!
    const body = new Uint8Array([1, 2, 3]);
    const commandId = 10;
    const reversed = 0;
    pdu.writeData(body, commandId, seqNum, reversed);
    pdu.updateSeqNo(seqNum);

    const pbData = pdu.getPbData();
    const newPdu = new Pdu(pbData);
    expect(newPdu.getSeqNum()).toBe(seqNum);
    newPdu.updateSeqNo(11)
    expect(newPdu.getSeqNum()).toBe(11);
  });
});
