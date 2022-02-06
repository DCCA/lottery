const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {interface, bytecode} = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    // get the contracts object
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode
        })
        .send({
            from: accounts[0], gas: '1000000'
        })
})

describe('Lottery Contract', () => {
    // check if the contract was deployed
    it('it deploys a contract', () => {
        assert.ok(lottery.options.address);
    })
    // check if the player can enter in the lottery
    it('allows one account to enter', async () => {
        // use the methods in the contract to enter in the lottery
        await lottery.methods.enter().send({
            from: accounts[0],
            // making sure you send a valid value to enter
            // using the web3 utils converter 
            value: web3.utils.toWei('0.02', 'ether')
        })
        // get the list of players in the lottery
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        // check if the corret player was in the lottery
        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    })
    // check if the player can enter in the lottery
    it('allows multiple accounts to enter', async () => {
        // use the methods in the contract to enter in the lottery
        await lottery.methods.enter().send({
            from: accounts[0],
            // making sure you send a valid value to enter
            // using the web3 utils converter 
            value: web3.utils.toWei('0.02', 'ether')
        })
        await lottery.methods.enter().send({
            from: accounts[1],
            // making sure you send a valid value to enter
            // using the web3 utils converter 
            value: web3.utils.toWei('0.02', 'ether')
        })
        await lottery.methods.enter().send({
            from: accounts[2],
            // making sure you send a valid value to enter
            // using the web3 utils converter 
            value: web3.utils.toWei('0.02', 'ether')
        })
        // get the list of players in the lottery
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })
        // check if the corret player was in the lottery
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    })
    // validate if the player is sending amount of ether needed to enter
    it('requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    })
    // validate if the manager is the one calling the function
    it('only manager can call pickWinner function', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            })
            assert(false);
        } catch (err) {
            assert(err);
        }
    })
    // check if the winner function is working correctly
    it('send money to the winner and resets the players array', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        })
        // getBalance works for any address
        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        })

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether'))
    })
})