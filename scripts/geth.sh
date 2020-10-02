rm ~/.ethereum/geth/transactions.rlp
echo "y
y
y" | geth removedb
geth init genesis.json
geth --ws --nousb --cache 4096 --mine --miner.threads=2 --miner.gaslimit 80000000 --miner.etherbase=0x0000000000000000000000000000000000000001
