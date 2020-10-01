echo "y
y
y" | geth removedb
geth init genesis.json
geth --ws --mine --miner.threads=2 --miner.etherbase=0x0000000000000000000000000000000000000001