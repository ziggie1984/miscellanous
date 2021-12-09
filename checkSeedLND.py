#This does only work for LND
#Only do this if you understand the process.
#Never enter secrets into online webpages.
#This guide is based on https://www.lightningnode.info/technicals/restorelndonchainfundsinelectrum

#Before starting download chantools by guggero git@github.com:guggero/chantools.git
#For using the Script you are going to extract the BIP32 rootkey of your LND node, make sure you are offline and on a privacy preserving OS (Tails)
#Get Rootkey with `chantools showrootkey` 
#Type in your 24 seed phrase in the terminal and the decipher password in case you used one

#you will get the BIP32 Rootkey encoded in Base58

xpriv_bip32rootkey = 'xprv9s21ZrQH143K2EsGrybhaKSKkK7XgH8sM6QThYL99jc4tn2z8mQUt1GTeFuhtuCMgmDe8vXd1rzpqkDCXqKBhS4Y9w6f56ENg7Di5w5szbk'


import base58
from cryptotools.BTC import Xprv
from cryptotools.ECDSA.secp256k1 import PrivateKey,PublicKey
from bip32 import BIP32


HARDENED_INDEX = 0x80000000
ENCODING_PREFIX = {
    "main": {
        "private": 0x0488ADE4,
        "public": 0x0488B21E,
    },
    "test": {
        "private": 0x04358394,
        "public": 0x043587CF,
    },
}

def _serialize_extended_key(key, depth, parent, index, chaincode, network="main"):
    """Serialize an extended private *OR* public key, as spec by bip-0032.
    :param key: The public or private key to serialize. Note that if this is
                a public key it MUST be compressed.
    :param depth: 0x00 for master nodes, 0x01 for level-1 derived keys, etc..
    :param parent: The parent pubkey used to derive the fingerprint, or the
                   fingerprint itself None if master.
    :param index: The index of the key being serialized. 0x00000000 if master.
    :param chaincode: The chain code (not the labs !!).
    :return: The serialized extended key.
    """
    for param in {key, chaincode}:
        assert isinstance(param, bytes)
    for param in {depth, index}:
        assert isinstance(param, int)
    if parent:
        assert isinstance(parent, bytes)
        if len(parent) == 33:
            fingerprint = _pubkey_to_fingerprint(parent)
        elif len(parent) == 4:
            fingerprint = parent
        else:
            raise ValueError("Bad parent, a fingerprint or a pubkey is" " required")
    else:
        fingerprint = bytes(4)  # master
    # A privkey or a compressed pubkey
    assert len(key) in {32, 33}
    if network not in {"main", "test"}:
        raise ValueError("Unsupported network")
    is_privkey = len(key) == 32
    prefix = ENCODING_PREFIX[network]["private" if is_privkey else "public"]
    extended = prefix.to_bytes(4, "big")
    extended += depth.to_bytes(1, "big")
    extended += fingerprint
    extended += index.to_bytes(4, "big")
    extended += chaincode
    if is_privkey:
        extended += b"\x00"
    extended += key
    return extended


def _unserialize_extended_key(extended_key):
    """Unserialize an extended private *OR* public key, as spec by bip-0032.
    :param extended_key: The extended key to unserialize __as bytes__
    :return: network (str), depth (int), fingerprint (bytes), index (int),
             chaincode (bytes), key (bytes)
    """
    assert isinstance(extended_key, bytes) and len(extended_key) == 78
    prefix = int.from_bytes(extended_key[:4], "big")
    network = None
    if prefix in list(ENCODING_PREFIX["main"].values()):
        network = "main"
    elif prefix in list(ENCODING_PREFIX["test"].values()):
        network = "test"
    depth = extended_key[4]
    fingerprint = extended_key[5:9]
    index = int.from_bytes(extended_key[9:13], "big")
    chaincode, key = extended_key[13:45], extended_key[45:]
    return network, depth, fingerprint, index, chaincode, key
  
  
zprv_prefix = b'\x04\xb2\x43\x0c'
zpriv_bip32rootkey = base58.b58encode_check(zprv_prefix + base58.b58decode_check(xpriv_bip32rootkey)[4:]).decode('ascii')


extended_key = base58.b58decode_check(xpriv_bip32rootkey)
(network,
 depth,
 fingerprint,
 index,
 chaincode,
 key) = _unserialize_extended_key(extended_key)


private_key_bip32rootkey = PrivateKey(key)
public_key_bip32rootkey = private_key_bip32rootkey.to_public()

public_key_serialized = public_key_bip32rootkey.encode(compressed=True)

extended_pubkey = _serialize_extended_key(public_key_serialized,0x00,None,0x00000000, chaincode)

xpub_bip32rootkey = base58.b58encode_check(extended_pubkey).decode()

zpub_prefix = b'\x04\xb2\x47\x46'
zpub_bip32rootkey = base58.b58encode_check(zpub_prefix + base58.b58decode_check(xpub_bip32rootkey)[4:]).decode('ascii')
print("zpub_bip32rootkey: %s"% zpub_bip32rootkey)

bip32 = BIP32.from_xpriv(xpriv_bip32rootkey)
#Derivation Path for Native Segwit Addresses
xpub_extended_key_bip84 =  bip32.get_xpub_from_path("m/84'/0'/0'")
zpub_extended_key_bip84 = base58.b58encode_check(zpub_prefix + base58.b58decode_check(xpub_extended_key_bip84)[4:]).decode('ascii')
#Include this output in a watchonly wallet in Electrum
print("zpub_extended_key_bip84: %s"% zpub_extended_key_bip84)

