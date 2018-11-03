pragma solidity 0.4.24;

interface tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external; }

contract SAIDToken {
    // Public variables of the token
    string public name = "Security Aid Token";
    string public symbol = "SAT";
    uint8 public decimals = 18; // 1 ETH = 10^18 Tokens
     uint public constant rate = 1;  // rate of token / wei for purchase

    // 18 decimals is the strongly suggested default, avoid changing it
    uint256 public totalSupply;

    // This creates an array with all balances
    mapping (address => uint256) private balanceOf;
    mapping (address => mapping (address => uint256)) private allowance;

    // This generates a public event on the blockchain that will notify clients
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // This generates a public event on the blockchain that will notify clients
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    
    event TokensMinted(address indexed to, uint256 value, uint256 totalSupply);


    /**
     * Internal transfer, only can be called by this contract
     * Called in transfer function
     */
    function _transfer(address _from, address _to, uint _amount) internal {
        // Prevent transfer to 0x0 address. Use burn() instead
        require(_to != 0x0, '0x0 address not allowed');
        // Check if the sender has enough
        require(balanceOf[_from] >= _amount, 'Sender balance is insufficient');
        // Check for overflows
        require(balanceOf[_to] + _amount >= balanceOf[_to]);
        // Save this for an assertion in the future
        uint previousBalances = balanceOf[_from] + balanceOf[_to];
        // Subtract from the sender
        balanceOf[_from] -= _amount;
        // Add the same to the recipient
        balanceOf[_to] += _amount;
        emit Transfer(_from, _to, _amount);
        // Asserts are used to use static analysis to find bugs in your code. They should never fail
        assert(balanceOf[_from] + balanceOf[_to] == previousBalances);
    }

    /**
     * Transfer tokens
     *
     * Send `_value` tokens to `_to` from your account
     *
     * @param _to The address of the recipient
     * @param _amount the amount to send
     */
    function transfer(address _to, uint256 _amount) external returns (bool) {
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    /**
     * Transfer tokens from other address
     *
     * Send `_value` tokens to `_to` on behalf of `_from`
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _amount the amount to send
     */
    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool) {
        require(_amount <= allowance[_from][msg.sender], 'msg.sender has insufficient allowance');     // Check allowance
        allowance[_from][msg.sender] -= _amount;
        _transfer(_from, _to, _amount);
        return true;
    }

    /**
     * Set allowance for other address
     *
     * Allows `_spender` to spend no more than `_amount` tokens on your behalf
     *
     * @param _spender The address authorized to spend
     * @param _amount the max amount they can spend
     */
    function approve(address _spender, uint256 _amount) external returns (bool) {
        require(_amount > 0, 'Can not approve an amount <= 0, Token.approve()');
        require(_amount <= balanceOf[msg.sender], 'Amount is greater than senders balance, Token.approve()');
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    /**
     * Set allowance for other address and notify
     *
     * Allows `_spender` to spend no more than `_value` tokens on your behalf, and then ping the contract about it
     *
     * @param _spender The address authorized to spend
     * @param _amount the max amount they can spend
     * @param _extraData some extra information to send to the approved contract
     */
    function approveAndCall(address _spender, uint256 _amount, bytes _extraData) external returns (bool) {
        tokenRecipient spender = tokenRecipient(_spender);
        if (this.approve(_spender, _amount)) {
            spender.receiveApproval(msg.sender, _amount, this, _extraData);
            return true;
        }
    }


    // Buy tokens with ether, mint and allocate new tokens to the purchaser.
    function buy() external payable returns (bool)
    {
        require(msg.value > 0, 'Cannot buy with a value of <= 0, Token.buy()');
    
        uint256 tokenAmount = msg.value * rate;
    
        totalSupply += tokenAmount;   // NOTE overflow
        balanceOf[msg.sender] += tokenAmount; // NOTE overflow
    
        emit TokensMinted(msg.sender, msg.value, totalSupply);
        emit Transfer(address(0), msg.sender, msg.value);
    
        return true;
    }
 
}