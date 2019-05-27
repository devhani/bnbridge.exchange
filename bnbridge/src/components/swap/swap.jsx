import React, { Component } from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography
} from '@material-ui/core'

import Input from '../common/input';
import Button from '../common/button';
import AssetSelection from "../assetSelection";

import {
  ERROR,
  SWAP_TOKEN,
  TOKEN_SWAPPED,
  FINALIZE_SWAP_TOKEN,
  TOKEN_SWAP_FINALIZED,
  TOKENS_UPDATED
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    width: '400px'
  },
  button: {
    marginTop: '24px'
  },
  frame: {
    border: '1px solid #e1e1e1',
    borderRadius: '3px',
    backgroundColor: '#fafafa',
    padding: '1rem'
  },
  instructions: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionUnderlined: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionBold: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px'
  },
  disclaimer: {
    fontSize: '12px',
    marginTop: '24px'
  },
});


class Swap extends Component {
  state = {
    page: 0,
    token: '',
    tokenError: false,
    bnbAddress: '',
    bnbAddressError: false,
    erc20address: '',
    erc20AddressError: false,
    amount: '',
    amountError: false,
    amountErrorMessage: '',
    amountHelperText: '',
    tokens: []
  };

  componentWillMount() {
    emitter.on(TOKENS_UPDATED, this.tokensUpdated);
    emitter.on(TOKEN_SWAPPED, this.tokenSwapped);
    emitter.on(TOKEN_SWAP_FINALIZED, this.tokenSwapFinalized);
    emitter.on(ERROR, this.error);
  };

  componentWillUnmount() {
    emitter.removeListener(TOKENS_UPDATED, this.tokensUpdated);
    emitter.removeListener(TOKEN_SWAPPED, this.tokenSwapped);
    emitter.removeListener(TOKEN_SWAP_FINALIZED, this.tokenSwapFinalized);
    emitter.removeListener(ERROR, this.error);
  };

  tokensUpdated = () => {
    const tokens = store.getStore('tokens')

    this.setState({
      tokens: tokens
    })
  };

  error = (err) => {
    this.props.showError(err)
  }

  tokenSwapped = (data) => {
    this.setState({
      page: 1,
      swapUuid: data.swap_uuid,
      ethDepositAddress: data.eth_address,
      symbol: data.symbol
   })
  };

  tokenSwapFinalized = (data) => {
    this.setState({ page: 2 })
  };

  callSwapToken = () => {

    const {
      token,
      bnbAddress,
      erc20address,
      amount,
    } = this.state

    const content = {
      token_uuid: token,
      bnb_address: bnbAddress,
      eth_address: erc20address,
      amount: amount
    }
    dispatcher.dispatch({type: SWAP_TOKEN, content })
  };

  callFinalizeSwapToken = () => {
    const {
      swapUuid
    } = this.state

    const content = {
      uuid: swapUuid,
    }
    dispatcher.dispatch({type: FINALIZE_SWAP_TOKEN, content })
  };

  validateSwapToken = () => {

    this.setState({
      tokenError: false,
      bnbAddressError: false,
      erc20AddressError: false,
      amountError: false,
      amountErrorMessage: ''
    })

    const {
      token,
      bnbAddress,
      erc20address,
      amount,
      tokens
    } = this.state

    let error = false

    if(!token || token === '') {
      this.setState({ tokenError: true })
      error = true
    }
    if(!bnbAddress || bnbAddress === '') {
      this.setState({ bnbAddressError: true })
      error = true
    }
    if(!erc20address || erc20address === '') {
      this.setState({ erc20AddressError: true })
      error = true
    }
    if(!amount || amount === '') {
      this.setState({ amountError: true })
      error = true
    }

    let theToken = tokens.filter((tok) => {
      return tok.uuid === token
    })

    if(theToken && theToken.length > 0) {

      if(theToken[0].minimum_swap_amount != null && parseFloat(amount) < parseFloat(theToken[0].minimum_swap_amount)) {
        this.setState({ amountError: true, amountErrorMessage: 'Amount < Minimum Swap Amount: '+theToken[0].minimum_swap_amount+' '+theToken[0].symbol })
        error = true
      }

      return !error
    }

    return false

  };

  onNext = (event) => {
    switch (this.state.page) {
      case 0:
        if(this.validateSwapToken()) {
          this.callSwapToken()
        }
        break;
      case 1:
        this.callFinalizeSwapToken()
        break;
      case 2:
        this.resetPage()
        break;
      default:

    }
  };

  resetPage = () => {
    this.setState({
      page: 0,
      token: '',
      tokenError: false,
      bnbAddress: '',
      bnbAddressError: false,
      erc20address: '',
      erc20AddressError: false,
      amount: '',
      amountError: false,
    })
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onTokenSelected = (value) => {

    const {
      tokens
    } = this.state

    let theToken = tokens.filter((tok) => {
      return tok.uuid === value
    })

    let amountHelperText = ''

    if(theToken && theToken.length > 0) {
      if(theToken[0].minimum_swap_amount != null) {
        amountHelperText = 'Minimum amount is '+theToken[0].minimum_swap_amount+' '+theToken[0].symbol
      }
    }

    this.setState({ token: value, amountHelperText: amountHelperText })
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  };

  renderPage0 = () => {

    const {
      bnbAddress,
      bnbAddressError,
      erc20address,
      erc20AddressError,
      amount,
      amountError,
      amountErrorMessage,
      amountHelperText,
    } = this.state

    const {
      onIssue,
      classes
    } = this.props

    return (
      <React.Fragment>
        <AssetSelection onIssue={ onIssue } onTokenSelected={ this.onTokenSelected } />
        <Grid item xs={ 12 }>
          <Input
            id='bnbAddress'
            fullWidth={ true }
            label="BNB receive address"
            placeholder="eg: bnb1mmxvnhkyqrvd2dpskvsgl8lmft4tnrcs97apr3"
            value={ bnbAddress }
            error={ bnbAddressError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id='erc20address'
            fullWidth={ true }
            label="ERC20 from address"
            placeholder="eg: 0x0dE0BCb0703ff8F1aEb8C892eDbE692683bD8030"
            value={ erc20address }
            error={ erc20AddressError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id='amount'
            fullWidth={ true }
            label="Amount"
            placeholder="eg: 100"
            value={ amount }
            error={ amountError }
            onChange={ this.onChange }
            helpertext={ amountErrorMessage && amountErrorMessage !== '' ? amountErrorMessage : amountHelperText }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Typography className={ classes.disclaimer }>By swapping a token here, you agree to bnbridge's Terms of Service.</Typography>
        </Grid>
      </React.Fragment>
    )
  };

  renderPage1 = () => {
    const {
      amount,
      symbol,
      ethDepositAddress,
      erc20address
    } = this.state

    const {
      classes
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
        <Typography className={ classes.instructionUnderlined }>
            Here's what you need to do next:
          </Typography>
          <Typography className={ classes.instructionBold }>
            Transfer {amount} {symbol}
          </Typography>
          <Typography className={ classes.instructions }>
            from
          </Typography>
          <Typography className={ classes.instructionBold }>
            {erc20address}
          </Typography>
          <Typography className={ classes.instructions }>
            to
          </Typography>
          <Typography className={ classes.instructionBold }>
            {ethDepositAddress}
          </Typography>
          <Typography className={ classes.instructionUnderlined }>
            After you've completed the transfer, click the "NEXT" button so we can verify your transaction.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  renderPage2 = () => {
    const {
      classes
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionBold }>
            Awesome
          </Typography>
          <Typography className={ classes.instructions }>
            Your transaction was successfull.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  render() {
    const {
      classes
    } = this.props

    const {
      page
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        { page > 0 &&
          <Grid item xs={ 6 } align='left' className={ classes.button }>
            <Button
              label="Back"
              onClick={ this.onBack }
            />
          </Grid>
        }
        <Grid item xs={ page > 0 ? 6 : 12 } align='right' className={ classes.button }>
          <Button
            label={page === 2 ? "Done" : "Next"}
            onClick={ this.onNext }
          />
        </Grid>
      </Grid>
    )
  };
}

Swap.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Swap);
