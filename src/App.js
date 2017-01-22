import React,  {  Component } from 'react';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Flexbox from 'flexbox-react';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();
import CryptoJS from "crypto-js";

if(!process.env.REACT_APP_ELECTRON){
  var mySocket=new WebSocket("ws://localhost:4000", "protocolOne"); 
  var isOpen=false;
  var holdMessages=[];
  mySocket.onopen=(event)=>{
    isOpen=true;
    holdMessages.map((val, index)=>{
      mySocket.send(val);
    })
    holdMessages="";
  }
  window.socket={
    definedKeys:{},
    send:(key, value)=>{
      var obj={};
      obj[key]=value;
      if(!isOpen){
        holdMessages.push(JSON.stringify(obj));
       // mySocket.send(JSON.stringify(obj));
      }
      else{
        console.log(obj);
        mySocket.send(JSON.stringify(obj));
      }
      
    },
    on:(key, cb)=>{
      window.socket.definedKeys[key]=cb;
    }

  }
  mySocket.onmessage=(event)=>{
    const data=JSON.parse(event.data);
    const key=Object.keys(data)[0];
    if(window.socket.definedKeys[key]){
      window.socket.definedKeys[key](null, data[key]);
    }
  }
}

import Dialog from 'material-ui/Dialog';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import CircularProgress from 'material-ui/CircularProgress';

import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
//const centerComponent={display: 'flex', justifyContent: 'center'};
const blockChainView='https://testnet.etherscan.io/address/';
const selection=[
    "Temperament",
    "Name",
    "Owner", //this can be encrypted
    "Address" //this can be encrypted
];
const centerComponent={display: 'flex', /*alignItems: 'center',*/ justifyContent: 'center'};
const formatAttribute=(attributeType, attributeValue)=>{
  var obj={};
  obj[attributeType]=attributeValue;
  return obj;
}
const decrypt=(password, text)=>{ //attributeText
    var decrypted="";
    try{
      decrypted=CryptoJS.AES.decrypt(text, password).toString(CryptoJS.enc.Utf8);
    }
    catch(e){
      console.log(e);
    }
    return decrypted;
}
class TblRow extends Component {/*=({attributeText, isEncrypted, onDecrypt, timestamp, label, wrongPassword})=>{*/
  constructor(props){
    super(props);
    this.state={
      isEncrypted:this.props.isEncrypted,
      attributeText:this.props.attributeText,
      wrongPassword:false,
      password:"",
      showPasswordModal:false
    }
  }
  onDecrypt=()=>{
    this.setState({
      showPasswordModal:true
    })
  }
  onPasswordSubmit=()=>{
    const decryptedValue=decrypt(this.state.password, this.state.attributeText);
    this.setState({
      password:"",
      wrongPassword:decryptedValue?false:true,
      attributeText:decryptedValue,
      isEncrypted:decryptedValue?false:true,
      showPasswordModal:false
    }, ()=>{
      setTimeout(()=>{this.setState({wrongPassword:false})}, 3000)
    })
  }
  setPassword=(event, value)=>{
    this.setState({
      password:value
    })
  }
  hideModal=()=>{
    this.setState({
      showPasswordModal:false
    })
  }
  render(){
    return(
      <TableRow>   
        <PasswordModal onPassword={this.onPasswordSubmit} setPassword={this.setPassword} hidePasswordModal={this.hideModal} askForPassword={this.state.showPasswordModal}/>          
        <TableRowColumn>{this.props.timestamp}</TableRowColumn>
        <TableRowColumn>{this.props.label}</TableRowColumn>
        <TableRowColumn>{this.state.isEncrypted?this.state.wrongPassword?<RaisedButton label="Wrong Password" onClick={this.onDecrypt}/>:
            <RaisedButton disabled={!this.state.isEncrypted} label="Decrypt" onClick={this.onDecrypt}/>:
          this.state.attributeText}
        </TableRowColumn>
    </TableRow>
    );
  }
}

class AboutComponent extends Component {
  state={
    closed:true
  }
  onAbout=()=>{
    this.setState({
      closed:false
    })
  }
  onAboutClose=()=>{
    this.setState({
      closed:true
    })
  }
  render(){
    return(
      <div>
        <RaisedButton label="Learn More" primary={true} onClick={this.onAbout}/>
        <AboutModal contractAddress={this.props.contractAddress} onClick={this.onAboutClose} hideModal={this.state.closed}/>
      </div>
    )
  }
  
}
const AboutModal=({hideModal, onClick, contractAddress})=>
<Dialog
  title="About"
  actions={<FlatButton
        label="Ok"
        primary={true}
        onClick={onClick}
      />}
  modal={false}
  open={!hideModal}
  onRequestClose={onClick}
>
  <h4>How it works</h4>
      <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners). 
      
      The contract that governs this is available at {contractAddress} on the blockchain.  See it <a href={blockChainView+contractAddress} target="_blank">here.</a> </p>
</Dialog>


const ErrorModal=({showError, hideError})=>
      <Dialog
        title="Error!"
        actions={<FlatButton
              label="Ok"
              primary={true}
              onClick={hideError}
            />}
        modal={false}
        open={showError?true:false}
        onRequestClose={hideError}
      >
      {showError}
      </Dialog>
const PasswordModal=({onPassword, setPassword, hidePasswordModal, askForPassword})=>
<Dialog
  title="Enter Password"
  open={askForPassword}
  onRequestClose={hidePasswordModal}
>
  <SubmitPassword onCreate={onPassword} onType={setPassword}/>
</Dialog>



const TableColumns=({success, children})=>
<Table>
    <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
      <TableRow>
        <TableHeaderColumn>TimeStamp</TableHeaderColumn>
        <TableHeaderColumn>Attribute</TableHeaderColumn>
        <TableHeaderColumn>Value</TableHeaderColumn>
      </TableRow>
    </TableHeader>
    {success?
    <TableBody displayRowCheckbox={false}>
    {children}
    </TableBody>
    :null}
</Table>

const SubmitPassword=({onCreate, onType, hasSubmitted=false, error=""})=>
<form onSubmit={(e)=>{e.preventDefault();onCreate();}}>
    <TextField autoFocus floatingLabelText="Password" type="password" onChange={onType}/>
    {hasSubmitted?<CircularProgress size={40}/>:error?<RaisedButton primary={true} label={error} />:
    <RaisedButton primary={true} label="Submit"/>}
</form>




const EntryForm=({selectValue, shouldDisable, cost, onSelect, onText, onCheck, onSubmit, onPassword, isChecked, formValidation})=>
<form onSubmit={(e)=>{e.preventDefault();formValidation()?onSubmit():"";}}>
  <SelectAttribute value={selectValue} onSelect={onSelect}/>
  <br/>
  <TextField
    autoFocus
    fullWidth={true}
    floatingLabelText="Value"
    disabled={shouldDisable}  onChange={onText}
  />
  <br/>
  {isChecked?
  <TextField fullWidth={true} floatingLabelText="Password" type="password" onChange={onPassword}/>:null}
  <br/>
  <Checkbox 
    disabled={shouldDisable}  
    label="Add Encryption" 
    defaultChecked={true} 
    onCheck={onCheck}/>
  <br/>

  <RaisedButton 
    fullWidth={true}
    disabled={formValidation()} 
    type="submit"
    primary={true}
   label={`Submit New Result (costs ${cost} Ether)`}
   onClick={onSubmit}/>
</form>          

class GethLogin extends Component{
  constructor(props){
    super(props);
    this.state = {
      error:"",
      waitingResults:false,
      password:""
    };
    window.socket.on('passwordError', (event, arg)=>{
      console.log(arg);
      this.setState({error:arg, waitingResults:false}, 
        setTimeout(()=>{
          this.setState({
            error:""
        })}, 3000)  )});
    window.socket.on('successLogin', (event, arg)=>{
      console.log(arg);
      this.setState({
        waitingResults:false
      })
      this.props.onSuccessLogin();
    });
  }
  
  handleSubmitPassword=()=>{
    this.setState({
      waitingResults:true
    })
    window.socket.send('password', this.state.password);
  }
  handleTypePassword=(event, value)=>{
    this.setState({
      password:value
    });
  }

  render() {
   // const {finished, stepIndex} = this.state;
    //const contentStyle = {margin: '0 16px'};

    return (
      <div style={centerComponent}>
        <div>
          {this.props.hasAccount?<span>Password to login to account</span>:<span>Enter a password to generate your account.<br/>Don't forget this password!</span>}
          <SubmitPassword onType={this.handleTypePassword} onCreate={this.handleSubmitPassword} hasSubmitted={this.state.waitingResults} error={this.state.error} />
        </div>
      </div>
    );
  }
}

const SelectAttribute=({value, onSelect})=>
<SelectField 
  floatingLabelText="Select Attribute"
  onChange={onSelect}
  value={value}
  defaultValue={0}
  fullWidth={true}
>
  {selection.map((val, index)=>{
      return(<MenuItem key={index} value={index} primaryText={val}/>);
  })}
</SelectField>

const MyProgressBar=({value})=>{
  return value>0?<div style={centerComponent}><CircularProgress  key="firstCircle" size={80} thickness={5} mode="determinate"  value={value}/></div>:<div style={centerComponent}><CircularProgress  key="secondCircle" size={80} thickness={5} /></div>
}
const SyncWrap=({isSyncing, children, progress})=>{
  return isSyncing?<MyProgressBar value={progress}/>:children
}
class App extends Component {
  constructor(props){
    super(props); 
    this.state={
      contractAddress:"",
      account:"",
      isSyncing:true,
      gethPasswordEntered:false,
      successSearch:false,
      cost:0,
      showEntry:false,
      moneyInAccount:0,
      showError:"",
      addedEncryption:true,//for entering data
      historicalData:[],
      currentProgress:0,
      hasAccount:false,
      password:"",//for entereing data
      attributeValue:"", //for entering data
      attributeType:0 //for entering ata
    };
    window.socket.send('startEthereum', 'ping')
    window.socket.on('accounts', (event, arg) => {
      console.log(arg);
      this.setState({
        account:arg
      });
    })
    window.socket.on('hasAccount', (event, arg) => {
      console.log(arg);
      this.setState({
        hasAccount:true
      });
    })
    window.socket.on('sync', (event, arg) => {
      console.log(arg);
      this.setState(arg);
    })
    window.socket.on('cost', (event, arg) => {
      console.log(arg);
      this.setState({
        cost:arg
      });
    })
    window.socket.on('petId', (event, arg) => {
      console.log(arg);
      this.setState({
        petId:arg
      });
    })
    window.socket.on('contractAddress', (event, arg) => {
      this.setState({
        contractAddress:arg
      });
    })
    window.socket.on('moneyInAccount', (event, arg) => {
      console.log(arg);
      this.setState({
        moneyInAccount:arg
      });
    })
    window.socket.on('error', (event, arg) => {
      console.log(arg);
      this.setState({
        showError:arg
      });
    })
    window.socket.on('retrievedData', (event, arg) => {
      console.log(arg);
      this.retrievedData(arg);

    })
  }
  retrievedData=(arg)=>{
    this.setState({
      successSearch:arg[0]?true:false,
      historicalData:arg,
    });
  }
  onAttributeValue=(event, value)=>{
      this.setState({
          attributeValue:value
      });      
  }
  onAttributeType=(event, label, value)=>{
      this.setState({
          attributeType:value
      });      
  }
  toggleAdditionalEncryption=()=>{
      this.setState({
          addedEncryption:!this.state.addedEncryption
      });
  }
  setPassword=(event, value)=>{
      this.setState({
          password:value
      });
  }
  onPassword=()=>{
    const attVal=Object.assign(formatAttribute(this.state.attributeType,CryptoJS.AES.encrypt(this.state.attributeValue, this.state.password).toString()), {addedEncryption:true});
    this.submitAttribute(attVal, attVal[this.state.attributeType]);
  }
  onSubmit=()=>{
    var obj={};
    if(this.state.addedEncryption){
      this.onPassword();
    }
    else{
      this.submitAttribute(formatAttribute(this.state.attributeType,this.state.attributeValue), this.state.attributeValue);
    }
  }
  submitAttribute=(formattedAttribute, attVal)=>{
    if(this.state.moneyInAccount>this.state.cost){
      window.socket.send('addAttribute', formattedAttribute)
      this.setState({
        historicalData:this.state.historicalData.concat([{timestamp:new Date(), attributeText:attVal, attributeType:this.state.attributeType, isEncrypted:this.state.addedEncryption}]),
        showEntry:false
      },()=>{
        this.retrievedData(this.state.historicalData);
      });
      
    }
    else{
      alert("Not enough money");
    }
    
  }
  showEntryModal=()=>{
    this.setState({
      showEntry:true
    });
  }
  hideEntryModal=()=>{
    this.setState({
      showEntry:false
    });
  }
  hideError=()=>{
    this.setState({
      showError:""
    });
  }
  onGethLogin=()=>{
    this.setState({
      hasAccount:true,
      gethPasswordEntered:true
    })
  }
  entryValidation=()=>{
    return !(this.state.petId&&(this.state.password||!this.state.addedEncryption)&&this.state.attributeValue);
  }
  render(){
    const mainStyle = {
      margin: 20,
    };
    console.log(this.state.isSyncing);
    console.log(this.state.hasAccount);
    console.log(this.state.gethPasswordEntered);
      return(
<MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
  <div>
    <CustomToolBar 
      account={this.state.account} 
      moneyInAccount={this.state.moneyInAccount}
      contractAddress={this.state.contractAddress}/>
   
    <ErrorModal 
      showError={this.state.showError} 
      hideError={this.hideError}/>
    <Dialog
      open={this.state.showEntry}
      onRequestClose={this.hideEntryModal}
    >
      <EntryForm 
        selectValue={this.state.attributeType}
        onSelect={this.onAttributeType}
        onCheck={this.toggleAdditionalEncryption}
        cost={this.state.cost}
        onText={this.onAttributeValue}
        shouldDisable={!this.state.petId}
        onSubmit={this.onSubmit}
        onPassword={this.setPassword}
        isChecked={this.state.addedEncryption}
        formValidation={this.entryValidation}
      />
    </Dialog>
    <div style={mainStyle}>
    {this.state.hasAccount&&this.state.gethPasswordEntered?
      <SyncWrap isSyncing={this.state.isSyncing} progress={this.state.currentProgress}>
        <div>
          <RaisedButton primary={true} label="Add Entry" onClick={this.showEntryModal}/>
          <TableColumns success={this.state.successSearch}>
          {this.state.historicalData.map((val, index)=>{
            return(
                <TblRow key={index} timestamp={val.timestamp.toString()} attributeText={val.attributeText}  label={selection[val.attributeType]||"Unknown"} isEncrypted={val.isEncrypted}/>
            );
          })}
          </TableColumns>              
        </div>
      </SyncWrap>:
      <GethLogin hasAccount={this.state.hasAccount} onSuccessLogin={this.onGethLogin}/>
    }
    </div>
    
    <div className='whiteSpace'></div>
    <div className='whiteSpace'></div>
    <div className='whiteSpace'></div>
    <div className='whiteSpace'></div>
  </div>
</MuiThemeProvider>
      );
  }
}
const CustomToolBar=({account, moneyInAccount, contractAddress})=>
 <Toolbar>
  <ToolbarGroup firstChild={true}>
   <ToolbarTitle text="SkyPet" />
    {`Account: ${account}`}
  <ToolbarSeparator/>
  {account?moneyInAccount==0?"Ether required!  Send the account some Ether to continue.":`Balance: ${moneyInAccount}`:""}
  </ToolbarGroup>
  <ToolbarGroup>
    <AboutComponent contractAddress={contractAddress}/>
  </ToolbarGroup>
</Toolbar>
export default App;