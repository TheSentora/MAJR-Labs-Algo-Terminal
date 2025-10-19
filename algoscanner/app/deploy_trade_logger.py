# Deploy trade logger app to TESTNET. If no mnemonic, auto-generate and exit.
from pyteal import *
from algosdk.v2client import algod
from algosdk import mnemonic, transaction, account
import base64, sys

def approval():
    owner=Bytes("owner"); total=Bytes("total")
    last_trader=Bytes("last_trader"); last_side=Bytes("last_side")
    last_base=Bytes("last_base"); last_quote=Bytes("last_quote"); last_amt=Bytes("last_amt")
    on_create=Seq(App.globalPut(owner, Txn.sender()), App.globalPut(total, Int(0)), Approve())
    on_log=Seq(
        App.globalPut(total, App.globalGet(total)+Int(1)),
        App.globalPut(last_trader, Txn.sender()),
        App.globalPut(last_side, Txn.application_args[0]),
        App.globalPut(last_base, Btoi(Txn.application_args[1])),
        App.globalPut(last_quote, Btoi(Txn.application_args[2])),
        App.globalPut(last_amt, Txn.application_args[3]),
        Approve()
    )
    return Cond([Txn.application_id()==Int(0), on_create],
                [Txn.on_completion()==OnComplete.NoOp, on_log])

def clear(): return Approve()

ALGOD_URL  = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# ---- paste your 25-word TESTNET mnemonic here; leave "" to auto-generate ----
SENDER_MN = "flower license frown metal phone monkey charge glue napkin urge accuse absurd hill ranch photo casino mixture sand force glove rain frost arrest ability pilot"

if __name__ == "__main__":
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

    if not SENDER_MN.strip():
        # auto-generate a fresh testnet account
        sk, addr = account.generate_account()
        mn = mnemonic.from_private_key(sk)
        print("=== NEW TESTNET ACCOUNT ===")
        print("Address:", addr)
        print("Mnemonic (25 words):")
        print(mn)
        print("\nFund this address from the Algorand TestNet Dispenser, then:")
        print("1) Paste the 25-word mnemonic into SENDER_MN in this file")
        print("2) Run:  python deploy_trade_logger.py")
        sys.exit(0)

    # use provided mnemonic
    sk = mnemonic.to_private_key(SENDER_MN)
    addr = account.address_from_private_key(sk)

    approval_teal = compileTeal(approval(), mode=Mode.Application, version=8)
    clear_teal    = compileTeal(clear(),    mode=Mode.Application, version=8)

    ac = client.compile(approval_teal); cc = client.compile(clear_teal)
    approval_bin = base64.b64decode(ac["result"])
    clear_bin    = base64.b64decode(cc["result"])

    sp = client.suggested_params()
    global_schema = transaction.StateSchema(num_uints=3, num_byte_slices=4)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    txn = transaction.ApplicationCreateTxn(
        sender=addr, sp=sp,
        on_complete=transaction.OnComplete.NoOpOC.real,
        approval_program=approval_bin, clear_program=clear_bin,
        global_schema=global_schema, local_schema=local_schema
    )

    stxn = txn.sign(sk)
    txid = client.send_transaction(stxn)
    res = transaction.wait_for_confirmation(client, txid, 4)
    print("Deployed App ID:", res["application-index"])
