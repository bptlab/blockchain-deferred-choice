rm ~/.ethereum/geth/transactions.rlp
echo "y
y
y" | geth removedb
geth init genesis.json
geth --ws --nousb --cache 4096 --mine --miner.threads=1 --miner.gaslimit 80000000 --miner.gastarget 800 --miner.etherbase=0x0000000000000000000000000000000000000001
