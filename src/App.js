import React, { Component } from 'react';
import logo from './said.png';
import './App.css';
// Import the web3 library
import Web3 from 'web3'

// Material UI
import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import DropDownMenu from 'material-ui/DropDownMenu';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

// Import build Artifacts
import tokenArtifacts from './build/contracts/Token.json'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      amount: 0,
      availableAccounts: [],
      defaultAccount: 0,
      ethBalance: 0,
      rate: 1,
      tokenBalance: 0,
      tokenSymbol: 0,
      transferAmount: '',
      transferUser: '',
      token: null, // token contract
      transferAccountNum: 0,
      userAccounts: [],
      ngoAccounts: [],
    }
  }

  componentDidMount() {
    // Create a web3 connection
    this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    if (this.web3.isConnected()) {
      this.web3.eth.getAccounts((err, accounts) => {
        const defaultAccount = this.web3.eth.accounts[0]
        const transferAccountNum = this.web3.eth.accounts[0];

        let users = ["Oliver", "Robbie"]
        let ngos = ["AID-A", "AID-B", "AID-C", "AID-D", "AID-E", "AID-F", "AID-G", "AID-H"];
        
        // Append all available accounts
        for (let i = 0; i < users.length; i++) {
          this.setState({
            userAccounts: this.state.userAccounts.concat(
              <MenuItem value={i} key={accounts[i]} primaryText={users[i]} />
            )
          })
        }
        for (let i = 0; i < ngos.length; i++) {
          this.setState({
            ngoAccounts: this.state.ngoAccounts.concat(
              <MenuItem value={i} key={accounts[i+users.length]} primaryText={ngos[i]} />
            )
          })
        }

        this.web3.version.getNetwork(async (err, netId) => {
          // Create a reference object to the deployed token contract
          if (netId in tokenArtifacts.networks) {
            const tokenAddress = tokenArtifacts.networks[netId].address
            const token = this.web3.eth.contract(tokenArtifacts.abi).at(tokenAddress)
            this.setState({ token })
            console.log(token)

            // Set token symbol below
            token.symbol((err, tokenSymbol) => {
              this.setState({ tokenSymbol })
            })

            // Set wei / token rate below
            token.rate((err, rate) => {
              this.setState({ rate: rate.toNumber() })
            })

            this.loadEventListeners()
            this.loadAccountBalances(defaultAccount)
            this.loadAccountBalancesTransfer(transferAccountNum)
          }
        })
      })
    }
  }

  /**
   * Load the accounts token and ether balances.
   * @param  {Address} account The user's ether address.
   */
  loadAccountBalances(account) {
    if (this.state.token) {
      // Set token balance below
      this.state.token.balanceOf(account, (err, balance) => {
        this.setState({ tokenBalance: balance.toNumber() })
      })

      // Set ETH balance below
      this.web3.eth.getBalance(account, (err, ethBalance) => {
        this.setState({ ethBalance })
      })
    }
  }

  loadAccountBalancesTransfer(account) {
    if (this.state.token) {
      // Set token balance below
      this.state.token.balanceOf(account, (err, balance) => {
        this.setState({ tokenBalanceTransfer: balance.toNumber() })
      })

      // Set ETH balance below
      this.web3.eth.getBalance(account, (err, ethBalance) => {
        this.setState({ ethBalanceTransfer: ethBalance })
      })
    }
  }

  // Create listeners for all events.
  loadEventListeners() {
    // Watch tokens transfer event below
    this.state.token.Transfer({ fromBlock: 'latest', toBlock: 'latest' })
    .watch((err, res) => {
      console.log(`Tokens Transferred! TxHash: https://kovan.etherscan.io/tx/${res.transactionHash}`)
      this.loadAccountBalances(this.web3.eth.accounts[this.state.defaultAccount])
    })
  }

  // Buy new tokens with eth
  buy(amount) {
    this.state.token.buy({
      from: this.web3.eth.accounts[this.state.defaultAccount],
      value: amount
    }, (err, res) => {
      err ? console.error(err) : console.log(res)
    })
  }

  // Transfer tokens to a user
  transfer(user, amount) {
    console.log(user);
    if (amount > 0) {
      // Execute token transfer below
      this.state.token.transfer(user, amount, {
        from: this.web3.eth.accounts[this.state.defaultAccount]
      }, (err, res) => {
        err ? console.error(err) : console.log(res)
      })
    }
    
  }

  // When a new account in selected in the available accounts drop down.
  handleDropDownChange = (event, index, defaultAccount) => {
    this.setState({ defaultAccount })
    this.loadAccountBalances(this.state.userAccounts[index].key)
  }

  handleDropDownChangeTransfer = (event, index, transferAccountNum) => {
    this.setState({ transferAccountNum })
    this.loadAccountBalancesTransfer(this.state.ngoAccounts[index].key)
  }

  render() {
    let users = ["Oliver", "Robbie"]
    let ngos = ["AID-A", "AID-B", "AID-C", "AID-D", "AID-E", "AID-F", "AID-G", "AID-H"];
    let component

    component = <div className="Mainbody">

      <h3>Active Account</h3>
      <DropDownMenu maxHeight={300} width={500} value={this.state.defaultAccount} onChange={this.handleDropDownChange}>
        {this.state.userAccounts}
      </DropDownMenu>

      <h3>Balances</h3>
      <p className="App-intro">{this.state.ethBalance / 1e18} ETH</p>
      <p className="App-intro"> {this.state.tokenBalance} {this.state.tokenSymbol}</p>
      <br />
      <div>
        <h3>Buy Tokens</h3>
        <h5>Rate: {this.state.rate} {this.state.tokenSymbol} / wei</h5>
        <TextField floatingLabelText="Token Amount." style={{width: 200}} value={this.state.amount}
          onChange={(e, amount) => {this.setState({ amount })}}
        />
        <RaisedButton label="Buy" labelPosition="before" primary={true}
          onClick={() => this.buy(this.state.amount/this.state.rate)}
        />
      </div>
      <br />
      <div>
        <h3>Transfer Tokens</h3>

        <DropDownMenu maxHeight={300} width={500} value={this.state.transferAccountNum} onChange={this.handleDropDownChangeTransfer}>
          {this.state.ngoAccounts}
        </DropDownMenu>
        <p className="App-intro">{this.state.ethBalanceTransfer / 1e18} ETH</p>
        <p className="App-intro"> {this.state.tokenBalanceTransfer} {this.state.tokenSymbol}</p>
        
        <TextField floatingLabelText="Amount." style={{width: 100}} value={this.state.transferAmount}
          onChange={(e, transferAmount) => { this.setState({ transferAmount })}}
        />
        <RaisedButton label="Transfer" labelPosition="before" primary={true}
          onClick={() => this.transfer(this.state.ngoAccounts[this.state.transferAccountNum].key, this.state.transferAmount)}
        />

      </div>
    </div>

    return (
      <MuiThemeProvider>
        <div className="App">
          <header className="App-header">
            <img src={logo} alt="logo" style={{height: '279px', width: '350px'}}/>
          </header>
          {component}
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
