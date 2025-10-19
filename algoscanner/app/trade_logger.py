# trade_logger.py
from pyteal import *

def approval():
    owner = Bytes("owner")
    total = Bytes("total")
    last_trader = Bytes("last_trader")
    last_side = Bytes("last_side")
    last_base = Bytes("last_base")
    last_quote = Bytes("last_quote")
    last_amt = Bytes("last_amt")

    on_create = Seq(
        App.globalPut(owner, Txn.sender()),
        App.globalPut(total, Int(0)),
        Approve()
    )

    is_noop = Txn.on_completion() == OnComplete.NoOp

    # args: [SIDE("BUY"/"SELL"), baseId(uint64), quoteId(uint64), amount_str(bytes)]
    on_log = Seq(
        App.globalPut(total, App.globalGet(total) + Int(1)),
        App.globalPut(last_trader, Txn.sender()),
        App.globalPut(last_side, Txn.application_args[0]),
        App.globalPut(last_base, Btoi(Txn.application_args[1])),
        App.globalPut(last_quote, Btoi(Txn.application_args[2])),
        App.globalPut(last_amt, Txn.application_args[3]),
        Approve()
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [is_noop, on_log],
    )
    return program

def clear():
    return Approve()

if __name__ == "__main__":
    print(compileTeal(approval(), mode=Mode.Application, version=8))
